"use strict";
/**
 * Serviço para gerenciar jobs de busca em background
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobManager = void 0;
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
class JobManager {
    jobs = new Map();
    processos = new Map();
    /**
     * Cria um novo job de busca
     */
    criarJob(termo, numResultados, fornecedores, usuarioId, quantidade, custo_beneficio, rigor, refinamento, salvamento, faltante_id, urls_add, ponderacao_web_llm) {
        const jobId = (0, uuid_1.v4)();
        const job = {
            id: jobId,
            status: 'pendente',
            criadoEm: new Date(),
            parametros: {
                termo,
                numResultados,
                fornecedores,
                usuarioId,
                quantidade: quantidade || 1,
                custo_beneficio: custo_beneficio || {},
                rigor: rigor || 0,
                ponderacao_web_llm,
                refinamento,
                salvamento,
                faltante_id,
                urls_add
            }
        };
        this.jobs.set(jobId, job);
        console.log(`📝 Job criado: ${jobId} para busca "${termo}"${refinamento ? ' (com refinamento LLM)' : ''}${faltante_id ? ` - Faltante ID: ${faltante_id}` : ''}`);
        // Executar job imediatamente
        this.executarJob(jobId);
        return jobId;
    }
    /**
     * Executa um job em processo filho
     */
    executarJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.error(`❌ Job ${jobId} não encontrado`);
            return;
        }
        // Atualizar status
        job.status = 'executando';
        job.iniciadoEm = new Date();
        this.jobs.set(jobId, job);
        console.log(`🚀 Iniciando execução do job ${jobId}`);
        // Detectar ambiente
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
        const isProduction = process.env.NODE_ENV === 'production';
        console.log(`🔧 Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
        // Criar processo filho para executar o worker
        const workerPath = path_1.default.join(__dirname, '../workers/buscaWorker.ts');
        console.log(`� Worker path: ${workerPath}`);
        let childProcess;
        if (isDevelopment) {
            // Desenvolvimento: usar ts-node/register
            console.log('🔧 Usando ts-node/register para desenvolvimento');
            childProcess = (0, child_process_1.spawn)('node', ['-r', 'ts-node/register', workerPath], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                cwd: process.cwd(),
                env: { ...process.env }
            });
        }
        else {
            // Produção: compilar TypeScript ou usar JavaScript
            const jsWorkerPath = path_1.default.join(__dirname, '../workers/buscaWorker.js');
            // Verificar se arquivo JS existe
            const fs = require('fs');
            if (fs.existsSync(jsWorkerPath)) {
                console.log('🔧 Usando arquivo JavaScript compilado para produção');
                childProcess = (0, child_process_1.spawn)('node', [jsWorkerPath], {
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                    cwd: process.cwd(),
                    env: { ...process.env }
                });
            }
            else {
                console.log('🔧 Fallback: usando ts-node em produção');
                childProcess = (0, child_process_1.spawn)('node', ['-r', 'ts-node/register', workerPath], {
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                    cwd: process.cwd(),
                    env: { ...process.env }
                });
            }
        }
        this.processos.set(jobId, childProcess);
        // Enviar dados do job para o processo filho via stdin
        const jobData = {
            id: jobId,
            termo: job.parametros.termo,
            numResultados: job.parametros.numResultados,
            fornecedores: job.parametros.fornecedores,
            usuarioId: job.parametros.usuarioId,
            quantidade: job.parametros.quantidade,
            custo_beneficio: job.parametros.custo_beneficio,
            rigor: job.parametros.rigor,
            ponderacao_web_llm: job.parametros.ponderacao_web_llm,
            refinamento: job.parametros.refinamento,
            salvamento: job.parametros.salvamento,
            faltante_id: job.parametros.faltante_id,
            urls_add: job.parametros.urls_add
        };
        childProcess.stdin?.write(JSON.stringify(jobData) + '\n');
        // Escutar mensagens do processo filho via stdout
        childProcess.stdout?.on('data', (data) => {
            try {
                const lines = data.toString().trim().split('\n');
                lines.forEach((line) => {
                    if (line.trim()) {
                        // Processar apenas linhas que começam com WORKER_MSG:
                        if (line.startsWith('WORKER_MSG:')) {
                            const jsonStr = line.substring('WORKER_MSG:'.length);
                            const message = JSON.parse(jsonStr);
                            this.processarMensagemDoFilho(jobId, message);
                        }
                        // Outras linhas são ignoradas (logs do dotenv, etc.)
                    }
                });
            }
            catch (error) {
                console.error(`Erro ao processar mensagem do worker:`, error);
            }
        });
        // Escutar erros do processo filho via stderr
        childProcess.stderr?.on('data', (data) => {
            const stderrData = data.toString();
            // Filtrar logs normais do worker que não são erros
            if (stderrData.includes('[WORKER]') ||
                stderrData.includes('[dotenv@') ||
                stderrData.includes('tip:') ||
                stderrData.includes('DeprecationWarning: The `punycode` module is deprecated')) {
                // Estes são logs normais, não erros
                console.log(`🔧 Worker log [${jobId}]: ${stderrData.trim()}`);
            }
            else {
                // Estes são erros reais
                console.error(`❌ Erro no worker do job ${jobId}: ${stderrData}`);
            }
        });
        // Escutar erro do processo filho
        childProcess.on('error', (error) => {
            console.error(`❌ Erro no processo filho do job ${jobId}:`, error);
            this.finalizarJobComErro(jobId, `Erro no processo: ${error.message}`);
        });
        // Escutar saída do processo filho
        childProcess.on('exit', (code, signal) => {
            console.log(`🔚 Processo filho do job ${jobId} encerrado (código: ${code}, sinal: ${signal})`);
            this.processos.delete(jobId);
        });
    }
    /**
     * Processa mensagens do processo filho
     */
    processarMensagemDoFilho(jobId, message) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        if (message.progresso) {
            // Atualizar progresso
            job.progresso = message.progresso;
            this.jobs.set(jobId, job);
            console.log(`📊 Job ${jobId} - ${message.progresso.etapa}: ${message.progresso.detalhes}`);
        }
        else if (message.status === 'sucesso') {
            // Job concluído com sucesso
            job.status = 'concluido';
            job.concluidoEm = new Date();
            job.parametros.quantidade = message.quantidade;
            job.resultado = {
                relatorio: message.relatorio,
                produtos: message.produtos,
                salvamento: message.salvamento,
                tempoExecucao: message.tempoExecucao
            };
            this.jobs.set(jobId, job);
            console.log(`✅ Job ${jobId} concluído com sucesso em ${message.tempoExecucao}ms`);
        }
        else if (message.status === 'erro') {
            // Job falhou
            this.finalizarJobComErro(jobId, message.erro);
        }
    }
    /**
     * Finaliza um job com erro
     */
    finalizarJobComErro(jobId, erro) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.status = 'erro';
        job.concluidoEm = new Date();
        job.erro = erro;
        this.jobs.set(jobId, job);
        // Matar processo se ainda estiver rodando
        const processo = this.processos.get(jobId);
        if (processo && !processo.killed) {
            processo.kill();
            this.processos.delete(jobId);
        }
        console.error(`❌ Job ${jobId} falhou: ${erro}`);
    }
    /**
     * Obtém o status de um job
     */
    getStatusJob(jobId) {
        return this.jobs.get(jobId) || null;
    }
    /**
     * Lista todos os jobs
     */
    listarJobs(limite = 50) {
        const todosJobs = Array.from(this.jobs.values());
        // Ordenar por data de criação (mais recentes primeiro)
        todosJobs.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
        return todosJobs.slice(0, limite);
    }
    /**
     * Cancela um job
     */
    cancelarJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        if (job.status === 'concluido' || job.status === 'erro') {
            return false; // Não pode cancelar job já finalizado
        }
        // Matar processo se estiver rodando
        const processo = this.processos.get(jobId);
        if (processo && !processo.killed) {
            processo.kill();
            this.processos.delete(jobId);
        }
        // Atualizar status
        job.status = 'erro';
        job.concluidoEm = new Date();
        job.erro = 'Job cancelado pelo usuário';
        this.jobs.set(jobId, job);
        console.log(`⏹️  Job ${jobId} cancelado`);
        return true;
    }
    /**
     * Remove jobs antigos da memória (limpeza)
     */
    limparJobsAntigos(diasParaManter = 7) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasParaManter);
        let removidos = 0;
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.criadoEm < dataLimite && (job.status === 'concluido' || job.status === 'erro')) {
                this.jobs.delete(jobId);
                removidos++;
            }
        }
        console.log(`🧹 Limpeza: ${removidos} jobs antigos removidos`);
        return removidos;
    }
}
// Singleton
exports.jobManager = new JobManager();
// Limpeza automática a cada 6 horas
setInterval(() => {
    exports.jobManager.limparJobsAntigos();
}, 6 * 60 * 60 * 1000);
//# sourceMappingURL=JobManager.js.map