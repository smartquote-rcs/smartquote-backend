# Justificativa das Modificações em `busca_local/main.py`

## Objetivo
Transformar o script em uma interface de linha de comando (CLI) que recebe um JSON via stdin, usa o campo `solicitacao` para executar o pipeline (LLM → brief → queries → busca) e retorna um JSON estruturado no stdout, mantendo logs no stderr. Opcionalmente, criar cotações.

## Resumo das mudanças
- CLI com flags:
  - `--server`: modo servidor (cada linha no stdin é um JSON de tarefa).
  - `--limite`: controla o top-N de resultados por query (validação contra limites do config).
  - `--no-multilingue`: desativa vetor multilingue.
  - `--criar-cotacao`: cria cotações automaticamente quando houver resultados.
- Entrada flexível:
  - Aceita envelope `{ rid, interpretation }` (modo fila) ou o próprio objeto de interpretação.
- Saída limpa para integração:
  - stdout: apenas um JSON de resultado (ou de erro) por tarefa.
  - stderr: progresso/logs humanos (não polui integrações).
- Nova função `processar_interpretacao(...)`:
  - Consome `interpretation.solicitacao`.
  - Gera brief, estrutura de queries e executa busca.
  - Retorna metadados + resumo dos resultados (Top-N por query) e lista de queries faltantes.
  - Cria cotações quando habilitado.
- Ajustes em `executar_estrutura_de_queries(...)`:
  - Parâmetro `verbose` para direcionar logs ao stderr.
  - Agregação de resultados por (nome, categoria_geral), mantendo o melhor score.
  - Pós-processamento para identificar queries faltantes (itens sem resultado e núcleo Q0/Q1).
- Robustez operacional:
  - Checagem de `GROQ_API_KEY` via env, com mensagem e saída JSON de erro quando ausente.
  - Inicialização e fechamento ordenado de conexões Weaviate/Supabase.
  - Indexação inicial de produtos do Supabase (quando disponíveis), com tratamento de erros por item.

## Motivação técnica
- Integração simples com outros serviços (ex.: Node, workers, filas): stdout só com JSON, stderr para logs humanos.
- Flexibilidade operacional: single-shot (spawn-on-demand) e modo `--server` (processo persistente) no mesmo binário.
- Baixa latência e eficiência: reuso de conexões e modelos em modo servidor, evitando overheading de inicialização a cada tarefa.
- Previsibilidade/observabilidade: formato de resposta fixo, com campos de correlação (`rid`), timestamps e status.

## Impacto e compatibilidade
- Backwards compatible: aceita tanto envelope `{ rid, interpretation }` quanto JSON direto da interpretação.
- Configurável: limites e uso do vetor multilingue via flags; `GROQ_API_KEY` via variável de ambiente.
- Logs separados: integrações que consomem stdout não serão "quebradas" por prints humanos.

## Como usar (Windows PowerShell)

1) Definir a chave da API do LLM (Groq):
```powershell
$env:GROQ_API_KEY = "<sua_chave_groq>"
```

2) Single-shot (JSON via stdin):
```powershell
@'
{
  "id": "interp_1755338975983_egzthblgq",
  "emailId": "198b25b138b97eb0",
  "tipo": "pedido",
  "prioridade": "media",
  "solicitacao": "Solicito a integração da API KYC-AML...",
  "confianca": 95
}
'@ | python .\busca_local\main.py --limite 10
```

3) Modo servidor (uma linha = um JSON):
```powershell
@'{ "rid":"1", "interpretation": { "id": "interp_...", "solicitacao": "..." } }'@ | python .\busca_local\main.py --server
```

4) Criar cotações automaticamente:
```powershell
@'<seu JSON aqui>'@ | python .\busca_local\main.py --criar-cotacao
```

## Contrato de I/O
- Entrada (single-shot): objeto JSON de interpretação OU envelope `{ rid, interpretation }`.
- Entrada (server): cada linha é um JSON (envelope ou interpretação pura).
- Saída: JSON único por tarefa com campos principais:
  - `status`, `processed_at`, `email_id`, `interpretation_id`, `tipo`, `prioridade`, `confianca`.
  - `faltantes`: IDs de queries sem resultados conforme regras Q0/Q1/itens.
  - `resultado_resumo`: Top-N por query com `nome`, `categoria`, `preco`, `score`, `produto_id`, `fonte`.
  - Se `--criar-cotacao`: objeto `cotacoes` com IDs e totais.

## Considerações de desempenho
- O modo `--server` preserva conexões e modelos em memória, amortizando custos de inicialização (LLM/Weaviate/Supabase). Ideal para alto volume.
- O modo single-shot é útil para integrações simples, scripts e testes ad hoc.

## Tratamento de erros
- Erros de parse de JSON e exceções inesperadas geram saída padronizada:
```json
{"status":"error","error":"<mensagem>","processed_at":"<iso>"}
```
- Logs detalhados no stderr (não afetam consumidores de stdout).

## Riscos e mitigação
- Indexação inicial pode aumentar o tempo de start: mantida por compatibilidade e com logs/contagem. Pode ser otimizada no futuro (lazy/batch/flags).
- Dependência de `GROQ_API_KEY`: validação antecipada com erro claro e saída JSON.
- Ausência de Supabase: operação continua com aviso; busca local pode funcionar com dados já existentes.

## Próximos passos sugeridos
- Flag para desabilitar indexação no start (`--no-index`), ou mover para tarefa separada.
- Adicionar timeouts/retries por etapa (LLM/Weaviate/Supabase) e métricas básicas (latência/erros).
- Pool de processos para paralelismo real quando necessário (mantendo o mesmo contrato de I/O).
- Testes automatizados (unitários e de integração) para o contrato do CLI.
- Structured logging (JSON no stderr) com níveis e IDs de correlação.

## Arquivos alterados
- `busca_local/main.py`: reescrito como CLI, com processamento por `interpretation.solicitacao`, saída limpa, logs no stderr, agregação de resultados e criação opcional de cotações.
