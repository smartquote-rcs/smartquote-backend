# 🔍 Exemplos Práticos - Consultas na Tabela Relatórios

## 📊 Consultas Básicas

### 1. **Ver todos os relatórios de uma cotação**
```sql
SELECT 
    id,
    cotacao_id,
    analise_local,
    criado_em
FROM relatorios 
WHERE cotacao_id = 123
ORDER BY criado_em DESC;
```

### 2. **Contar relatórios por status**
```sql
SELECT 
    analise_local -> 0 ->> 'status' as status_analise,
    COUNT(*) as quantidade
FROM relatorios 
GROUP BY status_analise
ORDER BY quantidade DESC;
```

### 3. **Produtos aceitos vs rejeitados hoje**
```sql
SELECT 
    CASE 
        WHEN analise_local -> 0 ->> 'status' = 'produto_adicionado' THEN 'Aceito'
        WHEN analise_local -> 0 ->> 'status' = 'rejeitado_por_llm' THEN 'Rejeitado'
        ELSE 'Outros'
    END as resultado,
    COUNT(*) as quantidade
FROM relatorios 
WHERE DATE(criado_em) = CURRENT_DATE
GROUP BY resultado;
```

## 🧠 Análises LLM

### 4. **Principais motivos de rejeição**
```sql
SELECT 
    analise_local -> 0 -> 'llm_relatorio' ->> 'justificativa_escolha' as motivo,
    COUNT(*) as frequencia
FROM relatorios 
WHERE analise_local @> '[{"status": "rejeitado_por_llm"}]'
    AND analise_local -> 0 -> 'llm_relatorio' ->> 'justificativa_escolha' IS NOT NULL
GROUP BY motivo
ORDER BY frequencia DESC
LIMIT 10;
```

### 5. **Produtos mais rejeitados**
```sql
SELECT 
    ranking.value ->> 'nome' as produto_nome,
    ranking.value ->> 'preco' as preco,
    COUNT(*) as rejeicoes,
    AVG((ranking.value ->> 'score_estimado')::float) as score_medio
FROM relatorios,
     jsonb_array_elements(analise_local -> 0 -> 'llm_relatorio' -> 'top_ranking') as ranking
WHERE analise_local @> '[{"status": "rejeitado_por_llm"}]'
GROUP BY produto_nome, preco
ORDER BY rejeicoes DESC
LIMIT 15;
```

### 6. **Critérios mais aplicados pela LLM**
```sql
SELECT 
    criterio.value as criterio_aplicado,
    COUNT(*) as frequencia
FROM relatorios,
     jsonb_array_elements_text(analise_local -> 0 -> 'llm_relatorio' -> 'criterios_aplicados') as criterio
WHERE analise_local -> 0 -> 'llm_relatorio' -> 'criterios_aplicados' IS NOT NULL
GROUP BY criterio_aplicado
ORDER BY frequencia DESC;
```

## 📈 Performance e Métricas

### 7. **Taxa de sucesso da LLM por período**
```sql
SELECT 
    DATE(criado_em) as data,
    COUNT(*) as total_analises,
    SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END) as aceitos,
    SUM(CASE WHEN analise_local @> '[{"status": "rejeitado_por_llm"}]' THEN 1 ELSE 0 END) as rejeitados,
    ROUND(
        (SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END)::float / 
         COUNT(*)::float) * 100, 2
    ) as taxa_aceitacao_pct
FROM relatorios 
WHERE criado_em >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(criado_em)
ORDER BY data DESC;
```

### 8. **Queries com mais problemas**
```sql
SELECT 
    analise_local -> 0 ->> 'query_id' as query_id,
    analise_local -> 0 ->> 'status' as status,
    COUNT(*) as ocorrencias
FROM relatorios 
WHERE analise_local -> 0 ->> 'status' IN ('sem_produtos_encontrados', 'produto_sem_id', 'rejeitado_por_llm')
GROUP BY query_id, status
ORDER BY ocorrencias DESC;
```

### 9. **Scores médios por categoria de produto**
```sql
SELECT 
    ranking.value ->> 'categoria' as categoria,
    COUNT(*) as total_produtos,
    AVG((ranking.value ->> 'score_estimado')::float) as score_medio_llm,
    AVG((analise_local -> 0 ->> 'score')::float) as score_medio_busca
FROM relatorios,
     jsonb_array_elements(analise_local -> 0 -> 'llm_relatorio' -> 'top_ranking') as ranking
WHERE analise_local -> 0 -> 'llm_relatorio' -> 'top_ranking' IS NOT NULL
GROUP BY categoria
HAVING COUNT(*) >= 5
ORDER BY score_medio_llm DESC;
```

## 🔧 Debugging e Troubleshooting

### 10. **Relatórios sem análise LLM**
```sql
SELECT 
    cotacao_id,
    analise_local -> 0 ->> 'query_id' as query_id,
    analise_local -> 0 ->> 'status' as status,
    analise_local -> 0 ->> 'observacao' as observacao,
    criado_em
FROM relatorios 
WHERE analise_local -> 0 -> 'llm_relatorio' IS NULL
ORDER BY criado_em DESC;
```

### 11. **Análise de erros por cotação**
```sql
SELECT 
    r.cotacao_id,
    COUNT(*) as total_queries,
    SUM(CASE WHEN analise_local @> '[{"status": "sem_produtos_encontrados"}]' THEN 1 ELSE 0 END) as sem_produtos,
    SUM(CASE WHEN analise_local @> '[{"status": "rejeitado_por_llm"}]' THEN 1 ELSE 0 END) as rejeitados_llm,
    SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END) as aceitos
FROM relatorios r
GROUP BY r.cotacao_id
HAVING SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END) = 0
ORDER BY total_queries DESC;
```

### 12. **Detalhes completos de uma query específica**
```sql
SELECT 
    cotacao_id,
    analise_local -> 0 ->> 'query_id' as query_id,
    analise_local -> 0 ->> 'status' as status,
    analise_local -> 0 ->> 'score' as score,
    analise_local -> 0 -> 'llm_relatorio' ->> 'escolha_principal' as decisao_llm,
    analise_local -> 0 -> 'llm_relatorio' ->> 'justificativa_escolha' as justificativa,
    jsonb_pretty(analise_local -> 0 -> 'llm_relatorio' -> 'top_ranking') as produtos_analisados,
    criado_em
FROM relatorios 
WHERE analise_local @> '[{"query_id": "Q1"}]'  -- Substitua Q1 pela query desejada
ORDER BY criado_em DESC;
```

## 📋 Views Úteis

### 13. **View para análises resumidas**
```sql
CREATE VIEW v_relatorios_resumo AS
SELECT 
    r.id,
    r.cotacao_id,
    r.analise_local -> 0 ->> 'query_id' as query_id,
    r.analise_local -> 0 ->> 'status' as status_analise,
    (r.analise_local -> 0 ->> 'score')::float as score_busca,
    r.analise_local -> 0 -> 'llm_relatorio' ->> 'escolha_principal' as decisao_llm,
    r.analise_local -> 0 -> 'llm_relatorio' ->> 'justificativa_escolha' as justificativa_llm,
    CASE 
        WHEN r.analise_local @> '[{"status": "produto_adicionado"}]' THEN true
        ELSE false
    END as produto_adicionado,
    r.criado_em
FROM relatorios r;
```

### 14. **View para métricas diárias**
```sql
CREATE VIEW v_metricas_diarias AS
SELECT 
    DATE(criado_em) as data,
    COUNT(*) as total_analises,
    SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END) as produtos_aceitos,
    SUM(CASE WHEN analise_local @> '[{"status": "rejeitado_por_llm"}]' THEN 1 ELSE 0 END) as produtos_rejeitados,
    SUM(CASE WHEN analise_local @> '[{"status": "sem_produtos_encontrados"}]' THEN 1 ELSE 0 END) as sem_produtos,
    ROUND(
        (SUM(CASE WHEN analise_local @> '[{"status": "produto_adicionado"}]' THEN 1 ELSE 0 END)::float / 
         COUNT(*)::float) * 100, 2
    ) as taxa_sucesso_pct
FROM relatorios 
GROUP BY DATE(criado_em)
ORDER BY data DESC;
```

## 💡 Dicas de Performance

### **Índices Recomendados**
```sql
-- Índice para busca por cotação
CREATE INDEX idx_relatorios_cotacao_id ON relatorios(cotacao_id);

-- Índice para busca por data
CREATE INDEX idx_relatorios_criado_em ON relatorios(criado_em);

-- Índice GIN para consultas JSONB
CREATE INDEX idx_relatorios_analise_local ON relatorios USING GIN(analise_local);

-- Índice para status específicos
CREATE INDEX idx_relatorios_status ON relatorios USING GIN((analise_local -> 0 ->> 'status'));
```

### **Otimização de Consultas**
1. Use `@>` para buscar valores específicos no JSONB
2. Evite `LIKE` em campos JSONB, prefira operadores específicos
3. Combine filtros de data com filtros JSONB para melhor performance
4. Use `LIMIT` em consultas exploratórias

---

*Exemplos atualizados em: 3 de setembro de 2025*  
*Versão: 2.0 - Compatível com nova estrutura de relatórios*
