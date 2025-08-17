from typing import Dict, Any, List, Optional

def _as_list_str(x: Any) -> List[str]:
    if x is None:
        return []
    if isinstance(x, list):
        return [str(i).strip() for i in x if str(i).strip()]
    if isinstance(x, str):
        return [s.strip() for s in x.split(",") if s.strip()]
    return [str(x).strip()]

def _flatten_specs_to_terms(specs: Any) -> List[str]:
    """
    Converte um objeto/dicionário de especificações em termos legíveis.
    Ex.: {"tamanho": "8GB", "tipo": "DDR4"} -> ["tamanho 8GB", "tipo DDR4"]
    """
    if not specs:
        return []
    if isinstance(specs, dict):
        terms = []
        for k, v in specs.items():
            k_s = str(k).strip()
            if isinstance(v, (list, tuple)):
                for vi in v:
                    vi_s = str(vi).strip()
                    if vi_s:
                        terms.append(f"{k_s} {vi_s}")
            else:
                v_s = str(v).strip()
                if v_s:
                    terms.append(f"{k_s} {v_s}")
        return terms
    # fallback simples
    return _as_list_str(specs)

def _prioridade_para_peso(prioridade: Optional[str]) -> float:
    """
    Mapeia prioridade textual para peso numérico (para ordenação/ponderação posterior).
    """
    if not prioridade:
        return 0.5
    mapa = {
        "critica": 1.0,
        "alta": 0.8,
        "media": 0.5,
        "baixa": 0.3
    }
    return mapa.get(str(prioridade).lower(), 0.5)

def _termo_por_requisito(req: Dict[str, Any]) -> str:
    """
    Constrói uma frase-termino a partir do requisito: nome + especificações mínimas + variações aceitáveis.
    """
    nome = str(req.get("nome", "")).strip()
    termos_especs = _flatten_specs_to_terms(req.get("especificacoes_minimas"))
    variacoes = _as_list_str(req.get("variacoes_aceitaveis"))
    partes = [nome] + termos_especs + variacoes
    partes = [p for p in partes if p]
    return " ".join(partes).strip()

def _semantica_join(partes: List[str]) -> str:
    """
    Junta partes para a consulta semântica, preservando contexto útil.
    """
    partes_limpa = [p.strip() for p in partes if p and str(p).strip()]
    return " | ".join(partes_limpa)

def gerar_query_principal(brief: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Gera a Query 0 (apenas se tipo_de_solucao == 'produto'):
    - Consulta semântica: solucao_principal + tags_semanticas
    - Categoria: deixar vazio (geral)
    - Palavras-chave específicas: requisitos críticos/altos (nome + especificações + variações)
    """
    tipo = str(brief.get("tipo_de_solucao", "")).lower()
    if tipo != "produto":
        return None

    solucao_principal = str(brief.get("solucao_principal", "")).strip()
    tags_sem = _as_list_str(brief.get("tags_semanticas"))
    requisitos = brief.get("requisitos_do_produto", []) or []

    # Categoria vazia
    categoria = None

    # Somente requisitos com nivel_de_exigencia crítica/alta
    termos_requisitos: List[str] = []
    for r in requisitos:
        nivel = str(r.get("nivel_de_exigencia", "")).lower()
        if nivel in {"critica", "alta"}:
            termo = _termo_por_requisito(r)
            if termo:
                termos_requisitos.append(termo)

    query_sem = _semantica_join([solucao_principal] + tags_sem)

    return {
        "id": "Q0",
        "tipo": "principal",
        "query": query_sem,
        "filtros": {
            "categoria": categoria if categoria else None,
            "palavras_chave": termos_requisitos or None
        },
        "peso_prioridade": 1.0,
        "fonte": {
            "solucao_principal": solucao_principal,
            "tags_semanticas": tags_sem
        }
    }

def gerar_queries_itens(brief: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Gera Queries 1..N para cada item de 'itens_a_comprar':
    - Consulta semântica: nome + tags + justificativa
    - Categoria: item.categoria
    - Palavras-chave específicas: especificacoes_minimas (flatten)
    - Peso pela prioridade do item
    """
    itens = brief.get("itens_a_comprar", []) or []
    queries: List[Dict[str, Any]] = []
    for idx, item in enumerate(itens, start=1):
        nome = str(item.get("nome", "")).strip()
        tags = _as_list_str(item.get("tags"))
        justificativa = str(item.get("justificativa", "")).strip()
        categoria = str(item.get("categoria", "")).strip() or None
        prioridade = str(item.get("prioridade", "")).lower()
        peso = _prioridade_para_peso(prioridade)

        if prioridade not in {"critica", "alta"}:
            # Se prioridade não for crítica ou alta, não gera query
            continue
        termos_especificos = _flatten_specs_to_terms(item.get("especificacoes_minimas"))

        query_sem = _semantica_join([nome] + tags + [justificativa])

        # quantidade do item (min 1)
        try:
            quantidade = int(item.get("quantidade", 1) or 1)
            if quantidade <= 0:
                quantidade = 1
        except Exception:
            quantidade = 1

        queries.append({
            "id": f"Q{idx}",
            "tipo": "item",
            "query": query_sem,
            "filtros": {
                "categoria": categoria,
                "palavras_chave": termos_especificos or None
            },
            "peso_prioridade": peso,
            "quantidade": quantidade,  # <-- incluir
            "fonte": {
                "nome": nome,
                "tags": tags,
                "prioridade": prioridade
            }
        })
    return queries

def _map_tipo_alternativa_para_categoria(tipo: Optional[str]) -> Optional[str]:
    """
    Mapeia 'tipo' da alternativa para uma categoria aproximada.
    """
    if not tipo:
        return None
    t = str(tipo).lower()
    if t in {"hardware", "software", "servico", "serviço"}:
        return "servico" if t in {"servico", "serviço"} else t
    # fallback: retorna próprio 'tipo' como categoria
    return t

def gerar_queries_alternativas(brief: Dict[str, Any], start_index: int = 1) -> List[Dict[str, Any]]:
    """
    Gera Queries N+1..M para 'alternativas_viaveis':
    - Consulta semântica: nome + vantagens + cenario_recomendado
    - Categoria: mapeada a partir de 'tipo'
    - Palavras-chave específicas: pode incluir 'vantagens' e (opcionalmente) termos derivados de 'limitacoes'
    """
    alternativas = brief.get("alternativas_viaveis", []) or []
    queries: List[Dict[str, Any]] = []
    offset = start_index
    for i, alt in enumerate(alternativas, start=offset):
        nome = str(alt.get("nome", "")).strip()
        vantagens = _as_list_str(alt.get("vantagens"))
        tipo = _map_tipo_alternativa_para_categoria(alt.get("tipo"))
        limitacoes = _as_list_str(alt.get("limitacoes"))
        query_sem = _semantica_join([nome] + vantagens)
        # Por padrão, usamos 'vantagens' como palavras-chave positivas; 'limitações' podem ser contexto adicional.
        palavras_chave = vantagens + limitacoes
        palavras_chave = [p for p in palavras_chave if p]

        queries.append({
            "id": f"QALT-{i}",
            "tipo": "alternativa",
            "query": query_sem,
            "filtros": {
                "categoria": tipo,
                "palavras_chave": palavras_chave or None
            },
            "peso_prioridade": 0.6,  # alternativas têm peso moderado por padrão
            "fonte": {
                "nome": nome,
                "tipo": alt.get("tipo"),
                "cenario_recomendado": alt.get("cenario_recomendado")
            }
        })
    return queries

def gerar_estrutura_de_queries(brief: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Orquestra a geração das queries estruturadas a partir do JSON (brief).
    Fluxo:
      - Q0 (se tipo == 'produto')
      - Q1..QN (itens_a_comprar)
      - QALT-* (alternativas_viaveis)
    """
    queries: List[Dict[str, Any]] = []

    # 0: principal (produto)
    q0 = gerar_query_principal(brief)
    if q0:
        queries.append(q0)

    q_itens = gerar_queries_itens(brief)
    queries.extend(q_itens)

    # Definir quantidade de Q0 = quantidade do primeiro item
    if q0 and q_itens:
        try:
            q0_quant = int(q_itens[0].get("quantidade", 1) or 1)
            if q0_quant <= 0:
                q0_quant = 1
        except Exception:
            q0_quant = 1
        q0["quantidade"] = q0_quant  # <-- setar quantidade em Q0

    # N+1..: alternativas viáveis
    start_idx_alt = (len(q_itens) + 1) if q_itens else 1
    q_alts = gerar_queries_alternativas(brief, start_index=start_idx_alt)
    queries.extend(q_alts)

    return queries
