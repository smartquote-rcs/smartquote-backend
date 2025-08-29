-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cotacoes (
  id bigint NOT NULL DEFAULT nextval('cotacoes_id_seq'::regclass),
  prompt_id bigint NOT NULL,
  aprovacao boolean,
  motivo character varying,
  aprovado_por bigint,
  cadastrado_em date NOT NULL DEFAULT CURRENT_DATE,
  atualizado_em date NOT NULL DEFAULT CURRENT_DATE,
  data_aprovacao timestamp without time zone,
  data_solicitacao timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  prazo_validade date,
  status character varying NOT NULL DEFAULT 'incompleta'::character varying CHECK (status::text = ANY (ARRAY['completa'::character varying::text, 'incompleta'::character varying::text])),
  observacoes text,
  condicoes jsonb DEFAULT '{}'::jsonb,
  faltantes jsonb DEFAULT '[]'::jsonb,
  orcamento_geral numeric NOT NULL DEFAULT 0,
  CONSTRAINT cotacoes_pkey PRIMARY KEY (id),
  CONSTRAINT cotacoes_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.cotacoes_itens (
  id bigint NOT NULL DEFAULT nextval('cotacoes_itens_id_seq'::regclass),
  cotacao_id bigint NOT NULL,
  produto_id bigint,
  origem character varying NOT NULL CHECK (origem::text = ANY (ARRAY['local'::character varying, 'api'::character varying, 'web'::character varying]::text[])),
  provider character varying,
  external_url text,
  item_nome text NOT NULL,
  item_descricao text,
  item_tags ARRAY DEFAULT '{}'::text[],
  item_preco numeric,
  item_moeda character DEFAULT 'BRL'::bpchar,
  condicoes jsonb DEFAULT '{}'::jsonb,
  payload jsonb DEFAULT '{}'::jsonb,
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  CONSTRAINT cotacoes_itens_pkey PRIMARY KEY (id),
  CONSTRAINT cotacoes_itens_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id),
  CONSTRAINT cotacoes_itens_cotacao_id_fkey FOREIGN KEY (cotacao_id) REFERENCES public.cotacoes(id)
);
CREATE TABLE public.dados_info (
  id bigint NOT NULL,
  sistema_id bigint NOT NULL,
  armazenamento double precision NOT NULL,
  tempo_atividade date NOT NULL,
  inicio_operacao date NOT NULL,
  registro_total double precision NOT NULL,
  CONSTRAINT dados_info_pkey PRIMARY KEY (id),
  CONSTRAINT dados_info_sistema_id_foreign FOREIGN KEY (sistema_id) REFERENCES public.sistema(id)
);
CREATE TABLE public.fornecedores (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome character varying NOT NULL,
  contato_email character varying NOT NULL,
  contato_telefone character varying NOT NULL,
  site character varying NOT NULL,
  observacoes text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  cadastrado_em date NOT NULL,
  cadastrado_por bigint NOT NULL,
  atualizado_em date NOT NULL,
  atualizado_por bigint NOT NULL,
  CONSTRAINT fornecedores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logs (
  id bigint NOT NULL,
  indice bigint NOT NULL,
  titulo character varying NOT NULL,
  assunto text NOT NULL,
  path_file character varying NOT NULL,
  cadastrado_em date NOT NULL,
  CONSTRAINT logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title character varying NOT NULL,
  subject text NOT NULL,
  type character varying NOT NULL,
  url_redir character varying NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.produtos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  fornecedor_id bigint NOT NULL,
  codigo character varying NOT NULL,
  nome character NOT NULL,
  modelo character NOT NULL,
  descricao text NOT NULL,
  preco bigint NOT NULL,
  unidade character varying NOT NULL DEFAULT 'un'::character varying,
  estoque integer NOT NULL DEFAULT 0,
  origem character varying NOT NULL CHECK (origem::text = ANY (ARRAY['local'::character varying, 'externo'::character varying]::text[])),
  cadastrado_por bigint NOT NULL,
  cadastrado_em date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_por bigint NOT NULL,
  atualizado_em date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  image_url text,
  produto_url text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  categoria character varying,
  disponibilidade character varying NOT NULL DEFAULT 'imediata'::character varying CHECK (disponibilidade::text = ANY (ARRAY['imediata'::character varying::text, 'por encomenda'::character varying::text, 'limitada'::character varying::text])),
  especificacoes_tecnicas jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT produtos_pkey PRIMARY KEY (id),
  CONSTRAINT produtos_fornecedor_id_foreign FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT produtos_atualizado_por_foreign FOREIGN KEY (atualizado_por) REFERENCES public.users(id),
  CONSTRAINT produtos_cadastrado_por_foreign FOREIGN KEY (cadastrado_por) REFERENCES public.users(id)
);
CREATE TABLE public.prompts (
  id bigint NOT NULL DEFAULT nextval('prompts_id_seq'::regclass),
  texto_original text NOT NULL,
  dados_extraidos json NOT NULL,
  origem json NOT NULL,
  status character varying NOT NULL DEFAULT 'recebido'::character varying CHECK (status::text = ANY (ARRAY['recebido'::character varying, 'pendente'::character varying, 'analizado'::character varying, 'enviado'::character varying]::text[])),
  dados_bruto json,
  cliente jsonb,
  CONSTRAINT prompts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.relatorios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  cotacao_id bigint NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  status character varying NOT NULL DEFAULT 'rascunho'::character varying CHECK (status::text = ANY (ARRAY['rascunho'::character varying, 'finalizado'::character varying, 'enviado'::character varying]::text[])),
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  criado_por bigint,
  analise_local ARRAY,
  analise_web ARRAY,
  proposta_email jsonb,
  CONSTRAINT relatorios_pkey PRIMARY KEY (id),
  CONSTRAINT relatorios_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id),
  CONSTRAINT relatorios_cotacao_id_fkey FOREIGN KEY (cotacao_id) REFERENCES public.cotacoes(id)
);
CREATE TABLE public.sistema (
  id bigint NOT NULL,
  nome_empresa character NOT NULL,
  idioma character NOT NULL,
  fuso_horario character NOT NULL DEFAULT 'auto'::bpchar,
  moeda character NOT NULL,
  backup character varying NOT NULL CHECK (backup::text = ANY (ARRAY['diario'::character varying, 'semanal'::character varying, 'mensal'::character varying, 'trimestral'::character varying]::text[])),
  manutencao boolean NOT NULL,
  tempo_de_sessao integer NOT NULL,
  politica_senha character NOT NULL,
  log_auditoria boolean NOT NULL,
  ip_permitidos character varying NOT NULL,
  CONSTRAINT sistema_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  email text NOT NULL,
  password character varying NOT NULL,
  department character varying NOT NULL,
  position character varying NOT NULL,
  contact character varying NOT NULL,
  created_at time without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  auth_id uuid DEFAULT auth.uid(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);