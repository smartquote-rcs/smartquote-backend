-- ============================================
-- MIGRATION: Sistema de Auditoria (Audit Logs)
-- Data: 2025-11-07
-- Descrição: Cria tabela robusta de auditoria para rastreamento de ações
-- ============================================

-- ============================================
-- 1. APAGAR A TABELA DE LOGS ANTIGA (se existir)
-- ============================================
DROP TABLE IF EXISTS public.logs CASCADE;

-- ============================================
-- 2. CRIAR A TABELA DE AUDITORIA ROBUSTA
-- ============================================
CREATE TABLE public.audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Quem executou a ação
    user_id uuid NOT NULL
        REFERENCES public.users(auth_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    -- Tipo da ação executada (ex: 'CREATE_QUOTE', 'UPDATE_PRODUCT')
    action varchar NOT NULL,

    -- Tabela afetada (ex: 'cotacoes')
    tabela_afetada varchar,

    -- ID do registro afetado dentro da tabela alvo
    registo_id bigint,

    -- Diferenças, payload, valores antigos/novos
    detalhes_alteracao jsonb DEFAULT '{}'::jsonb,

    -- Quando ocorreu
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_tabela ON public.audit_logs(tabela_afetada);
CREATE INDEX idx_audit_logs_registo ON public.audit_logs(registo_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- 4. ADICIONAR COMENTÁRIOS NA TABELA E COLUNAS
-- ============================================
COMMENT ON TABLE public.audit_logs IS 'Tabela de auditoria para rastreamento de ações no sistema';
COMMENT ON COLUMN public.audit_logs.id IS 'ID único do log de auditoria';
COMMENT ON COLUMN public.audit_logs.user_id IS 'UUID do usuário que executou a ação';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de ação executada (ex: CREATE_QUOTE, UPDATE_PRODUCT)';
COMMENT ON COLUMN public.audit_logs.tabela_afetada IS 'Nome da tabela afetada pela ação';
COMMENT ON COLUMN public.audit_logs.registo_id IS 'ID do registro afetado dentro da tabela';
COMMENT ON COLUMN public.audit_logs.detalhes_alteracao IS 'Detalhes da alteração em formato JSON';
COMMENT ON COLUMN public.audit_logs.created_at IS 'Data e hora da criação do log';

-- ============================================
-- 5. CRIAR VIEW PARA LOGS COM INFORMAÇÕES DO USUÁRIO
-- ============================================
CREATE OR REPLACE VIEW public.audit_logs_with_user AS
SELECT 
    al.id,
    al.user_id,
    u.nome as user_name,
    u.email as user_email,
    al.action,
    al.tabela_afetada,
    al.registo_id,
    al.detalhes_alteracao,
    al.created_at
FROM 
    public.audit_logs al
    LEFT JOIN public.users u ON al.user_id = u.auth_id
ORDER BY 
    al.created_at DESC;

COMMENT ON VIEW public.audit_logs_with_user IS 'View que une logs de auditoria com informações dos usuários';

-- ============================================
-- 6. CRIAR FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Validação: não permitir menos de 30 dias
    IF days_to_keep < 30 THEN
        RAISE EXCEPTION 'Não é permitido deletar logs com menos de 30 dias. Mínimo: 30 dias';
    END IF;
    
    -- Deletar logs antigos
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Deleta logs de auditoria mais antigos que X dias (mínimo 30 dias)';

-- ============================================
-- 7. CRIAR FUNÇÃO PARA OBTER ESTATÍSTICAS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_audit_stats(
    start_date timestamptz DEFAULT NULL,
    end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
    total_logs bigint,
    unique_users bigint,
    unique_actions bigint,
    unique_tables bigint,
    most_active_user uuid,
    most_common_action varchar,
    most_affected_table varchar
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_logs AS (
        SELECT *
        FROM public.audit_logs
        WHERE 
            (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
    ),
    stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT user_id) as users,
            COUNT(DISTINCT action) as actions,
            COUNT(DISTINCT tabela_afetada) as tables
        FROM filtered_logs
    ),
    top_user AS (
        SELECT user_id, COUNT(*) as count
        FROM filtered_logs
        GROUP BY user_id
        ORDER BY count DESC
        LIMIT 1
    ),
    top_action AS (
        SELECT action, COUNT(*) as count
        FROM filtered_logs
        GROUP BY action
        ORDER BY count DESC
        LIMIT 1
    ),
    top_table AS (
        SELECT tabela_afetada, COUNT(*) as count
        FROM filtered_logs
        WHERE tabela_afetada IS NOT NULL
        GROUP BY tabela_afetada
        ORDER BY count DESC
        LIMIT 1
    )
    SELECT 
        s.total,
        s.users,
        s.actions,
        s.tables,
        tu.user_id,
        ta.action,
        tt.tabela_afetada
    FROM stats s
    CROSS JOIN LATERAL (SELECT user_id FROM top_user) tu
    CROSS JOIN LATERAL (SELECT action FROM top_action) ta
    CROSS JOIN LATERAL (SELECT tabela_afetada FROM top_table) tt;
END;
$$;

COMMENT ON FUNCTION public.get_audit_stats IS 'Retorna estatísticas de auditoria para um período específico';

-- ============================================
-- 8. INSERIR ALGUNS LOGS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- ============================================
/*
-- Descomente para inserir dados de exemplo para testes

-- Exemplo 1: Criação de cotação
INSERT INTO public.audit_logs (user_id, action, tabela_afetada, registo_id, detalhes_alteracao)
VALUES (
    (SELECT auth_id FROM public.users LIMIT 1),
    'CREATE_QUOTE',
    'cotacoes',
    1,
    '{"descricao": "Cotação de teste", "valor_total": 10000.00}'::jsonb
);

-- Exemplo 2: Atualização de produto
INSERT INTO public.audit_logs (user_id, action, tabela_afetada, registo_id, detalhes_alteracao)
VALUES (
    (SELECT auth_id FROM public.users LIMIT 1),
    'UPDATE_PRODUCT',
    'produtos',
    1,
    '{"campo": "preco", "de": 100.00, "para": 120.00}'::jsonb
);

-- Exemplo 3: Login de usuário
INSERT INTO public.audit_logs (user_id, action, detalhes_alteracao)
VALUES (
    (SELECT auth_id FROM public.users LIMIT 1),
    'USER_LOGIN',
    '{"ip": "192.168.1.100", "sucesso": true}'::jsonb
);
*/

-- ============================================
-- 9. GRANT DE PERMISSÕES (AJUSTAR CONFORME NECESSÁRIO)
-- ============================================
-- GRANT SELECT, INSERT ON public.audit_logs TO seu_usuario_app;
-- GRANT SELECT ON public.audit_logs_with_user TO seu_usuario_app;
-- GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO seu_usuario_admin;
-- GRANT EXECUTE ON FUNCTION public.get_audit_stats TO seu_usuario_app;

-- ============================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
    -- Verificar se a tabela foi criada
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE '✅ Tabela audit_logs criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Erro: Tabela audit_logs não foi criada';
    END IF;
    
    -- Verificar índices
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE 'idx_audit_logs_%') THEN
        RAISE NOTICE '✅ Índices criados com sucesso!';
    ELSE
        RAISE WARNING '⚠️ Aviso: Alguns índices podem não ter sido criados';
    END IF;
    
    -- Verificar view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'audit_logs_with_user') THEN
        RAISE NOTICE '✅ View audit_logs_with_user criada com sucesso!';
    ELSE
        RAISE WARNING '⚠️ Aviso: View audit_logs_with_user não foi criada';
    END IF;
    
    RAISE NOTICE '🎉 Migration de Audit Logs concluída!';
END $$;
