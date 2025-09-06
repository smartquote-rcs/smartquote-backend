/**
 * Script para testar a correção do parsing de preços
 * Verifica se preços com vírgula estão sendo tratados corretamente
 */

// Simular as funções corrigidas
function parseNumero(precoStr?: string): number | null {
  if (!precoStr) return null;
  try {
    // Remove tudo que não seja dígito, ponto ou vírgula
    let numeroLimpo = precoStr.replace(/[^\d.,]/g, '');
    
    // Normalizar separadores decimais
    // Se tem vírgula, assumir que é separador decimal
    if (numeroLimpo.includes(',')) {
      // Se tem ponto E vírgula, ponto é separador de milhar
      if (numeroLimpo.includes('.')) {
        numeroLimpo = numeroLimpo.replace(/\./g, '').replace(',', '.');
      } else {
        // Só vírgula, converter para ponto decimal
        numeroLimpo = numeroLimpo.replace(',', '.');
      }
    }
    // Se só tem pontos, verificar se é separador de milhar ou decimal
    else if (numeroLimpo.includes('.')) {
      const partes = numeroLimpo.split('.');
      if (partes.length > 2 || (partes.length === 2 && partes[1] && partes[1].length === 3)) {
        // Múltiplos pontos ou último tem 3 dígitos = separador de milhar
        numeroLimpo = numeroLimpo.replace(/\./g, '');
      }
      // Senão, assumir que é separador decimal
    }
    
    const n = parseFloat(numeroLimpo);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

function converterPrecoParaCentavos(precoString: string | null | undefined): number {
  try {
    if (!precoString || precoString.trim() === '') {
      console.warn('Preço vazio ou nulo, usando 0');
      return 0;
    }

    // Remove tudo que não seja dígito, ponto ou vírgula
    let numeroLimpo = precoString.replace(/[^\d.,]/g, '');

    // Normalizar separadores decimais
    // Se tem vírgula, assumir que é separador decimal
    if (numeroLimpo.includes(',')) {
      // Se tem ponto E vírgula, ponto é separador de milhar
      if (numeroLimpo.includes('.')) {
        numeroLimpo = numeroLimpo.replace(/\./g, '').replace(',', '.');
      } else {
        // Só vírgula, converter para ponto decimal
        numeroLimpo = numeroLimpo.replace(',', '.');
      }
    }
    // Se só tem pontos, verificar se é separador de milhar ou decimal
    else if (numeroLimpo.includes('.')) {
      const partes = numeroLimpo.split('.');
      if (partes.length > 2 || (partes.length === 2 && partes[1] && partes[1].length === 3)) {
        // Múltiplos pontos ou último tem 3 dígitos = separador de milhar
        numeroLimpo = numeroLimpo.replace(/\./g, '');
      }
      // Senão, assumir que é separador decimal
    }

    // Converte para número
    const numero = parseFloat(numeroLimpo);

    if (isNaN(numero)) {
      console.warn('Preço inválido após limpeza:', precoString);
      return 0;
    }

    // Converte para centavos (garante inteiro)
    return Math.round(numero * 100);
  } catch (error) {
    console.warn('Erro ao converter preço:', precoString, error);
    return 0;
  }
}

// Casos de teste
const casosTeste = [
  // Formato Angola: vírgula como separador decimal
  { input: '2713791,77 kz', expected: 2713791.77, expectedCentavos: 271379177, descricao: 'Preço com vírgula decimal' },
  { input: '2.713.791,77', expected: 2713791.77, expectedCentavos: 271379177, descricao: 'Preço formatado Angola' },
  { input: '1.234.567,89', expected: 1234567.89, expectedCentavos: 123456789, descricao: 'Milhões com vírgula' },
  { input: '123,45', expected: 123.45, expectedCentavos: 12345, descricao: 'Valor simples com vírgula' },
  
  // Formato internacional: ponto como separador decimal
  { input: '2713791.77', expected: 2713791.77, expectedCentavos: 271379177, descricao: 'Preço com ponto decimal' },
  { input: '123.45', expected: 123.45, expectedCentavos: 12345, descricao: 'Valor simples com ponto' },
  
  // Casos de separador de milhar
  { input: '1.234.567', expected: 1234567, expectedCentavos: 123456700, descricao: 'Milhões sem decimal' },
  { input: '1,234,567.89', expected: 1234567.89, expectedCentavos: 123456789, descricao: 'Formato US com vírgula milhar' },
  
  // Casos problemáticos anteriores
  { input: 'AOA 2.713.791,77', expected: 2713791.77, expectedCentavos: 271379177, descricao: 'Com moeda' },
  { input: '2.713.791,77 Kz', expected: 2713791.77, expectedCentavos: 271379177, descricao: 'Com símbolo no final' },
];

console.log('🧪 TESTE DE CORREÇÃO - PARSING DE PREÇOS\n');
console.log('═'.repeat(80));

let passaram = 0;
let falharam = 0;

casosTeste.forEach((teste, index) => {
  console.log(`\n📋 Teste ${index + 1}: ${teste.descricao}`);
  console.log(`   Input: "${teste.input}"`);
  
  const resultadoFloat = parseNumero(teste.input);
  const resultadoCentavos = converterPrecoParaCentavos(teste.input);
  
  console.log(`   parseNumero: ${resultadoFloat} (esperado: ${teste.expected})`);
  console.log(`   centavos: ${resultadoCentavos} (esperado: ${teste.expectedCentavos})`);
  
  const floatOk = Math.abs((resultadoFloat || 0) - teste.expected) < 0.01;
  const centavosOk = resultadoCentavos === teste.expectedCentavos;
  
  if (floatOk && centavosOk) {
    console.log(`   ✅ PASSOU`);
    passaram++;
  } else {
    console.log(`   ❌ FALHOU`);
    if (!floatOk) console.log(`      - parseNumero incorreto: ${resultadoFloat} ≠ ${teste.expected}`);
    if (!centavosOk) console.log(`      - centavos incorreto: ${resultadoCentavos} ≠ ${teste.expectedCentavos}`);
    falharam++;
  }
});

console.log('\n' + '═'.repeat(80));
console.log(`📊 RESULTADO FINAL:`);
console.log(`   ✅ Passaram: ${passaram}/${casosTeste.length}`);
console.log(`   ❌ Falharam: ${falharam}/${casosTeste.length}`);

if (falharam === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! Problema de parsing de preços corrigido.');
} else {
  console.log('\n⚠️ Ainda há testes falhando. Revisar implementação.');
}

export {};
