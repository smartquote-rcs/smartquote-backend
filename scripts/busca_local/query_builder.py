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
        alternativas = _as_list_str(item.get("alternativas"))
        quantidade = int(item.get("quantidade", 1) or 1)
        orcamento_estimado = float(item.get("orcamento_estimado", 0) or 0)
        preferencia = str(item.get("preferencia", "")).strip().lower()
        peso = _prioridade_para_peso(prioridade)

        if prioridade not in {"critica", "alta"}:
            # Se prioridade não for crítica ou alta, não gera query
            continue
        termos_especificos = _flatten_specs_to_terms(item.get("especificacoes_minimas"))

        query_sem = _semantica_join([nome] + tags + [justificativa] + ["ou"] + alternativas)
        #custo beneficio para uma filtragem mais profunda contendo quantidade: x, orcamento_estimado: y, preferencia: z
        #só entra o campo de for diferente de 0
        custo_beneficio = {}
        if quantidade > 0:
            custo_beneficio["quantidade"] = quantidade
        if orcamento_estimado > 0:
            custo_beneficio["orcamento_maximo_estimado"] = orcamento_estimado
        if preferencia:
            custo_beneficio["preferencia"] = preferencia

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
            "custo_beneficio": custo_beneficio,  # <-- incluir
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

# Note: geração de queries alternativas removida intencionalmente. O fluxo agora gera apenas queries para itens.

def gerar_estrutura_de_queries(brief: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Orquestra a geração das queries estruturadas a partir do JSON (brief).
    Fluxo:
    - Q1..QN (itens_a_comprar)
    - (apenas itens)
    """
    queries: List[Dict[str, Any]] = []

    q_itens = gerar_queries_itens(brief)
    queries.extend(q_itens)
    return queries
