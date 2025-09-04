-- Adiciona colunas para representar faltantes como placeholders em cotacoes_itens
-- status: boolean (FALSE para placeholder/não encontrado; TRUE ou NULL para itens normais)
-- pedido: texto com a query_sugerida ou descrição do pedido

alter table if exists public.cotacoes_itens
  add column if not exists status boolean,
  add column if not exists pedido text;

-- Índice auxiliar para buscas por placeholders
create index if not exists idx_cotacoes_itens_cotacao_status on public.cotacoes_itens (cotacao_id, status);
