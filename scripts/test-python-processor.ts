/**
 * Script de teste para verificar o processamento Python de interpretações
 */

import { pythonProcessor } from '../src/services/PythonInterpretationProcessor';
import type { EmailInterpretation } from '../src/services/GeminiInterpretationService';

async function testPythonProcessor() {
  console.log('🧪 [TEST] Iniciando teste do processador Python...');
  
  // Verificar se Python está disponível
  const pythonAvailable = await pythonProcessor.checkPythonAvailability();
  if (!pythonAvailable) {
    console.error('❌ [TEST] Python não está disponível no sistema');
    console.log('💡 [TEST] Para instalar Python: https://www.python.org/downloads/');
    return;
  }
  
  // Criar N interpretações de teste para exercitar o pool
  const mkInterp = (i: number): EmailInterpretation => ({
    id: 'test_interp_' + Date.now() + '_' + i,
    emailId: 'test_email_' + i,
    tipo: 'pedido',
    prioridade: 'alta',
    solicitacao: `um computador portatil qualquer`,
    cliente: {
      nome: 'João Silva',
      empresa: 'Silva & Cia',
      email: 'joao@silva.com',
      telefone: '(11) 99999-9999'
    },
    confianca: 80 + (i % 10),
    interpretedAt: new Date().toISOString(),
    rawGeminiResponse: 'Resposta do Gemini AI...'
  });

  const N = 1; // maior que pool default para forçar fila
  const tasks = Array.from({ length: N }, (_, i) => mkInterp(i));
  console.log(`📧 [TEST] Enfileirando ${N} tarefas...`);

  const results = await Promise.all(tasks.map(t => pythonProcessor.processInterpretation(t)));

  results.forEach((res, i) => {
    if (res.success) {
      console.log(`✅ [TEST#${i}] Sucesso em ${res.executionTime}ms`);
    } else {
      console.error(`❌ [TEST#${i}] Falha: ${res.error}`);
    }
  });

  console.log('🏁 [TEST] Teste concluído');
}

// Executar teste
testPythonProcessor().catch(console.error);

export { testPythonProcessor };
