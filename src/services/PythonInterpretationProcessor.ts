/**
 * Serviço para executar processamento de interpretações em Python
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import type { EmailInterpretation } from './GeminiInterpretationService';

interface PythonProcessResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

type ResolveFn = (res: PythonProcessResult) => void;
type RejectFn = (err: any) => void;

interface QueueItem {
  interpretation: EmailInterpretation;
  resolve: ResolveFn;
  reject: RejectFn;
  rid: string;
}

class PersistentWorker {
  public proc: ChildProcess | null = null;
  public busy = false;
  public stdoutBuffer = '';
  public currentTask: QueueItem | null = null;
  private readonly scriptPath: string;
  private readonly onWorkerFree: () => void;
  private currentTimeout: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private shouldRespawn: boolean = true;

  constructor(scriptPath: string, onWorkerFree: () => void) {
    this.scriptPath = scriptPath;
    this.onWorkerFree = onWorkerFree;
    this.spawn();
  }

  private spawn() {
  // Inicia em modo servidor persistente do pipeline de busca e cria cotações automaticamente
  const args = [this.scriptPath, '--server', '--criar-cotacao'];
  this.proc = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  windowsHide: true
    });

    this.proc.stdout?.on('data', (data: Buffer) => {
      this.stdoutBuffer += data.toString();
      let idx;
      while ((idx = this.stdoutBuffer.indexOf('\n')) >= 0) {
        const line = this.stdoutBuffer.slice(0, idx).trim();
        this.stdoutBuffer = this.stdoutBuffer.slice(idx + 1);
        if (!line) continue;
        this.handleResultLine(line);
      }
    });

    this.proc.stderr?.on('data', (data: Buffer) => {
      const s = data.toString();
      console.log(`🐍 [PYTHON-LOG] ${s.trim()}`);
    });

    this.proc.on('error', (err: Error) => {
      console.error(`❌ [PYTHON-WORKER] Erro no processo Python: ${err.message}`);
      this.failCurrent(`Worker error: ${err.message}`);
      this.respawn();
    });

    this.proc.on('close', (code: number) => {
      console.warn(`⚠️ [PYTHON-WORKER] Processo encerrado (code=${code})`);
      this.failCurrent(`Worker exited (code=${code})`);
      this.respawn();
    });
  }

  private respawn() {
    // Limpa estado
    this.proc?.removeAllListeners();
    this.proc = null;
    this.busy = false;
    this.stdoutBuffer = '';
    // Respawn com pequeno atraso
  if (this.shouldRespawn) setTimeout(() => this.spawn(), 500);
  }

  private handleResultLine(line: string) {
    // Só tratamos como resultado quando a linha aparenta ser JSON.
    const trimmed = line.trim();
    const first = trimmed[0];
    if (first !== '{' && first !== '[') {
      // Linha não-JSON vinda do stdout (alguma lib pode escrever direto em stdout). Ignorar e continuar aguardando.
      console.log(`🐍 [PYTHON-OUT] ${trimmed}`);
      return;
    }

    // Tentar parsear JSON; somente ao sucesso concluímos a tarefa atual.
    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err: any) {
      // Linha parecia JSON mas falhou parse — manter tarefa ativa e aguardar próxima linha ou timeout.
      console.warn(`⚠️ [PYTHON-WORKER] Linha JSON inválida no stdout; aguardando próxima. Detalhe: ${err?.message || err}`);
      return;
    }

    const endTime = Date.now();
    const task = this.currentTask;
    if (!task) {
      // Resultado inesperado sem tarefa corrente — apenas logar.
      console.warn(`⚠️ [PYTHON-WORKER] Resultado recebido sem tarefa ativa: ${trimmed.slice(0, 200)}`);
      return;
    }

    // Fechar estado da tarefa atual
    this.currentTask = null;
    this.busy = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    const executionTime = parsed.__t != null ? parsed.__t : (task ? endTime - Number((task as any).__start) : 0);
    task.resolve({ success: parsed.status === 'success', result: parsed, error: parsed?.error, executionTime });

    // Notifica gerenciador para despachar próxima
    this.onWorkerFree();
  }

  private failCurrent(error: string) {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    const task = this.currentTask;
    this.currentTask = null;
    this.busy = false;
    if (task) task.resolve({ success: false, error, executionTime: 0 });
    this.onWorkerFree();
  }

  assign(task: QueueItem, timeoutMs: number) {
    if (!this.proc || !this.proc.stdin) {
      task.resolve({ success: false, error: 'Worker not ready', executionTime: 0 });
      return;
    }
  if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    this.busy = true;
    this.currentTask = task;
    (task as any).__start = Date.now();
    // Timeout
    this.currentTimeout = setTimeout(() => {
      console.error(`⏱️ [PYTHON-WORKER] Timeout de ${timeoutMs}ms — matando worker`);
      try { this.proc?.kill('SIGKILL'); } catch {}
      this.failCurrent('Task timeout');
    }, timeoutMs);

    // Enviar envelope JSON por linha
    const envelope = JSON.stringify({ rid: task.rid, interpretation: task.interpretation });
    try {
      this.proc.stdin.write(envelope + '\n');
      console.log(`� [PYTHON-WORKER] Tarefa enviada (rid=${task.rid})`);
    } catch (err: any) {
      console.error(`❌ [PYTHON-WORKER] Falha ao escrever no stdin: ${err?.message || err}`);
      this.failCurrent(`stdin write failed: ${err?.message || err}`);
    }
  }

  scheduleScaleDown(ttlMs: number) {
    if (ttlMs <= 0) return;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.busy) return; // já assumiu tarefa
      console.log(`🧹 [PYTHON-WORKER] Encerrando worker ocioso após ${ttlMs}ms`);
      this.shouldRespawn = false; // scale-down: não respawnar automaticamente
      try { this.proc?.kill('SIGKILL'); } catch {}
    }, ttlMs);
  }
}

class PythonInterpretationProcessor {
  private readonly scriptPath: string;
  private readonly minPool: number;
  private readonly maxPool: number;
  private readonly taskTimeoutMs: number;
  private readonly idleTtlMs: number;
  private queue: QueueItem[] = [];
  private workers: PersistentWorker[] = [];

  constructor(options?: { minPool?: number; maxPool?: number; taskTimeoutMs?: number; idleTtlMs?: number }) {
    // Usa caminho relativo ao diretório do projeto para funcionar em dev (ts-node) e build
  this.scriptPath = path.join(process.cwd(), 'scripts/busca_local/main.py');
  const cpu = Math.max(1, os.cpus().length || 1);
  const envMin = Number(process.env.PY_POOL_MIN ?? 1);
  const envMax = Number(process.env.PY_POOL_MAX ?? 1); // default 1 para evitar múltiplos processos por padrão
  this.minPool = options?.minPool ?? (isNaN(envMin) ? 1 : Math.max(0, envMin));
  this.maxPool = options?.maxPool ?? (isNaN(envMax) ? this.minPool : Math.max(this.minPool, envMax));
    this.taskTimeoutMs = options?.taskTimeoutMs ?? Number(process.env.PY_TASK_TIMEOUT_MS ?? 120000);
    this.idleTtlMs = options?.idleTtlMs ?? Number(process.env.PY_IDLE_TTL_MS ?? 300000); // 5 min

    console.log(`🐍 [PYTHON-POOL] min=${this.minPool} max=${this.maxPool} timeout=${this.taskTimeoutMs}ms idleTTL=${this.idleTtlMs}ms`);
    // Inicializa apenas o mínimo necessário
    for (let i = 0; i < this.minPool; i++) {
      this.workers.push(new PersistentWorker(this.scriptPath, () => this.onWorkerFree()));
    }
    this.registerExitHandlers();
  }

  /**
   * Enfileira e dispara se houver worker livre
   */
  async processInterpretation(interpretation: EmailInterpretation): Promise<PythonProcessResult> {
    return new Promise<PythonProcessResult>((resolve, reject) => {
      const rid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.queue.push({ interpretation, resolve, reject, rid });
      console.log(`📥 [PYTHON-POOL] Tarefa enfileirada (rid=${rid}). Fila: ${this.queue.length}`);
      this.pump();
    });
  }

  private pump() {
    // Atribui tarefas a workers livres
    for (const worker of this.workers) {
      if (!this.queue.length) break;
      if (worker.busy) continue;
      const task = this.queue.shift()!;
      worker.assign(task, this.taskTimeoutMs);
    }
    // Se ainda há fila, escalar até o máximo
    while (this.queue.length > 0 && this.workers.every(w => w.busy) && this.workers.length < this.maxPool) {
      console.log(`⤴️ [PYTHON-POOL] Escalando: criando worker ${this.workers.length + 1}/${this.maxPool}`);
      this.workers.push(new PersistentWorker(this.scriptPath, () => this.onWorkerFree()));
      // Worker novo chamará onWorkerFree quando pronto; mantemos itens na fila
      break; // evita loop apertado; aguardamos callback
    }
  }

  private registerExitHandlers() {
    const cleanup = () => {
      for (const w of this.workers) {
        try { (w as any).shouldRespawn = false; w.proc?.kill('SIGKILL'); } catch {}
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  }

  private onWorkerFree() {
    // Despacha próximas tarefas
    this.pump();
    // Programa scale-down para ociosos acima do mínimo
    const excess = Math.max(0, this.workers.length - this.minPool);
    if (excess > 0) {
      for (const w of this.workers) {
        if (!w.busy && this.workers.length > this.minPool) {
          w.scheduleScaleDown(this.idleTtlMs);
        }
      }
    }
  }

  /**
   * Verifica se Python está disponível no sistema
   */
  async checkPythonAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonCheck = spawn('python', ['--version'], { stdio: ['ignore', 'ignore', 'ignore'] });
      pythonCheck.on('close', (code: number) => resolve(code === 0));
      pythonCheck.on('error', () => resolve(false));
    });
  }
}

export default PythonInterpretationProcessor;
export const pythonProcessor = new PythonInterpretationProcessor();
export type { PythonProcessResult };
