/**
 * Script de teste para a nova funcionalidade de download direto de relatório
 * 
 * Este script demonstra como usar a nova rota POST /api/relatorios/gerar/:cotacaoId
 * que agora gera e faz download direto do PDF, sem salvar no servidor.
 * 
 * Para testar:
 * 1. Certifique-se de que o servidor está rodando (npm run dev)
 * 2. Execute: node test-download-relatorio.js
 * 3. Ou teste diretamente no Postman/Insomnia com:
 *    POST http://localhost:2000/api/relatorios/gerar/123
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function testarDownloadRelatorio(cotacaoId) {
  const options = {
    hostname: 'localhost',
    port: 2000,
    path: `/api/relatorios/gerar/${cotacaoId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log(`🧪 Testando download de relatório para cotação ${cotacaoId}...`);

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    if (res.statusCode === 200 && res.headers['content-type'] === 'application/pdf') {
      // Salvar o PDF recebido para demonstração
      const fileName = `relatorio_teste_cotacao_${cotacaoId}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, 'temp', fileName);
      
      // Garantir que o diretório existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log(`✅ PDF salvo com sucesso em: ${filePath}`);
        console.log(`📄 Tamanho do arquivo: ${fs.statSync(filePath).size} bytes`);
      });

      fileStream.on('error', (error) => {
        console.error('❌ Erro ao salvar PDF:', error);
      });
    } else {
      // Ler resposta como texto para erros
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          console.log('📄 Resposta:', jsonResponse);
        } catch {
          console.log('📄 Resposta (texto):', data);
        }
      });
    }
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error);
  });

  req.end();
}

// Testar com ID de cotação (substitua por um ID válido do seu sistema)
const cotacaoId = process.argv[2] || '123';
testarDownloadRelatorio(cotacaoId);

console.log(`
📋 INSTRUÇÕES PARA TESTE MANUAL:

1. Usando curl:
   curl -X POST http://localhost:2000/api/relatorios/gerar/${cotacaoId} -o relatorio.pdf

2. Usando Postman/Insomnia:
   - Método: POST
   - URL: http://localhost:2000/api/relatorios/gerar/${cotacaoId}
   - Na resposta, clique em "Download" para salvar o PDF

3. Usando navegador:
   - Faça uma requisição POST para a URL acima
   - O browser irá fazer download do PDF automaticamente
`);
