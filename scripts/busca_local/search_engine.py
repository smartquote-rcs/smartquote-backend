import weaviate
import weaviate.classes as wvc
from typing import Dict, Any, List, Tuple
import json
import re
import sys
import os
from groq import Groq

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from busca_local.text_utils import (
    normalize_text, expand_query_with_synonyms, preprocess_termos, 
    _detectar_especificidade
)
from busca_local.config import CATEGORY_EQUIV, STOPWORDS_PT, GROQ_API_KEY


def _llm_escolher_indice(query: str, filtros: dict | None, candidatos: List[Dict[str, Any]]) -> int:
    """Usa LLM (Groq) para escolher o índice do melhor candidato ou -1 se nenhum servir.

    Contrato rápido:
    - Input: query (str), filtros (dict ou None), candidatos (lista já limitada)
    - Output: int (índice 0-based do candidato escolhido; -1 se nenhum adequado)
    - Falhas: em erro de API ou chave ausente, retorna -1
    """
    if not candidatos:
        return -1

    api_key = os.environ.get("GROQ_API_KEY", GROQ_API_KEY)
    if not api_key:
        # Sem chave, não conseguimos refinar
        return -1

    # Compactar candidatos para o prompt (evitar payloads enormes)
    compacts: List[Dict[str, Any]] = []
    for i, c in enumerate(candidatos):
        compacts.append({
            "index": i,
            "nome": c.get("nome", ""),
            "categoria": c.get("categoria") or c.get("modelo") or "",
            "tags": c.get("tags") or [],
            "descricao": (c.get("descricao") or "")[:400],
            "preco": c.get("preco", None),
            "estoque": c.get("estoque", None),
        })

    prompt_sistema = (
        "Você é um assistente especializado em análise de produtos. Sua tarefa é analisar candidatos e escolher o melhor.\n"
        "IMPORTANTE: Responda APENAS com um número JSON válido no formato exato: {\"index\": N}\n"
        "Onde N é o índice (0, 1, 2...) do melhor candidato ou -1 se nenhum for adequado.\n"
        "Critérios de avaliação:\n"
        "1. Correspondência com a categoria solicitada\n"
        "2. Atendimento às especificações técnicas\n"
        "3. Relevância geral da consulta\n"
        "4. Disponibilidade em estoque\n"
        "5. Análise mais lógico-racional\n"
        "NÃO adicione explicações, comentários ou texto extra. APENAS o JSON."
    )
    filtros_str = "{}" if not filtros else json.dumps(filtros, ensure_ascii=False)
    user_msg = (
        f"QUERY: {query}\n"
        f"FILTROS: {filtros_str}\n"
        f"CANDIDATOS: {json.dumps(compacts, ensure_ascii=False)}\n"
        "Escolha o melhor índice ou -1."
    )

    try:
        client = Groq(api_key=api_key)
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": prompt_sistema},
                {"role": "user", "content": user_msg},
            ],
            temperature=0,
            max_tokens=50,
            stream=False,
        )
        
        content = (resp.choices[0].message.content or "").strip()
        print(f"[LLM] Resposta bruta: '{content}'", file=sys.stderr)
        
        # Tentar extrair JSON {"index": X}
        idx = -1
        try:
            # Primeiro, tentar buscar por um padrão JSON na resposta
            json_match = re.search(r'\{\s*"index"\s*:\s*(-?\d+)\s*\}', content)
            if json_match:
                idx = int(json_match.group(1))
                print(f"[LLM] Índice extraído via regex JSON: {idx}", file=sys.stderr)
            else:
                # Se não achou padrão JSON, tentar parse direto
                cleaned_content = content
                # Se a resposta contém apenas um número, envolver em JSON
                if re.match(r"^-?\d+$", content.strip()):
                    cleaned_content = f'{{"index": {content.strip()}}}'
                
                data = json.loads(cleaned_content)
                val = data.get("index")
                if isinstance(val, int):
                    idx = val
                    print(f"[LLM] Índice extraído via JSON parse: {idx}", file=sys.stderr)
        except Exception as e:
            print(f"[LLM] Erro ao fazer parse do JSON: {e}", file=sys.stderr)
            # fallback: buscar qualquer número na resposta
            number_match = re.search(r"-?\d+", content)
            if number_match:
                try:
                    idx = int(number_match.group(0))
                    print(f"[LLM] Índice extraído via regex numérica: {idx}", file=sys.stderr)
                except Exception:
                    idx = -1
        
        # Validar faixa
        if idx is None or not isinstance(idx, int):
            print(f"[LLM] Índice inválido: {idx}", file=sys.stderr)
            idx = -1
        if idx < 0 or idx >= len(candidatos):
            print(f"[LLM] Índice fora da faixa: {idx} (válido: 0-{len(candidatos)-1})", file=sys.stderr)
            return -1
        
        print(f"[LLM] Índice final selecionado: {idx}", file=sys.stderr)
        return idx
    except Exception as e:
        print(f"[LLM] Erro na chamada da API: {e}", file=sys.stderr)
        return -1

def construir_filtro(filtros: dict = None):
    """Constrói filtros do Weaviate v4 (apenas estruturais, texto é tratado pela busca híbrida)."""
    if not filtros:
        return None
    
    filtros_weaviate = []
    
    # Filtro por categoria (aceita string ou lista de strings)
    if "categoria" in filtros and filtros["categoria"]:
        categorias = filtros["categoria"] if isinstance(filtros["categoria"], list) else [filtros["categoria"]]
        filtros_weaviate.append(wvc.query.Filter.by_property("categoria").contains_any(categorias))
    
    # Combina filtros com AND lógico
    if not filtros_weaviate:
        return None
    return wvc.query.Filter.all_of(filtros_weaviate)

def calcular_score_filtros(produto: dict, filtros: dict | None) -> float:
    """Soft filter: em vez de eliminar, adiciona um boost ao score final"""
    if not filtros:
        return 0.0
    boost = 0.0
    try:
        # categoria ponderada (não elimina)
        if filtros.get("categoria"):
            categorias_raw = filtros["categoria"] if isinstance(filtros["categoria"], list) else [filtros["categoria"]]
            categorias_norm = [normalize_text(c) for c in categorias_raw if str(c).strip()]
            cat_prod = normalize_text(produto.get("categoria", "") or produto.get("modelo", ""))
            # considerar equivalências conhecidas
            candidatos: List[str] = []
            for c in categorias_norm:
                candidatos.append(c)
                candidatos.extend(CATEGORY_EQUIV.get(c, []))
            if any(c in cat_prod or cat_prod in c for c in set(candidatos)):
                boost += 0.2  # peso mais forte para categoria
        # pequeno boost para disponibilidade
        try:
            if int(produto.get("estoque", 0)) > 0:
                boost += 0.03
        except Exception:
            pass
    except Exception:
        pass
    # Limite de boost total por filtros
    return min(0.3, boost)

def calcular_relevancia_por_array(produto: dict, termos_pesquisa: list[str]) -> float:
    """
    Calcula a relevância de um produto com base em uma lista de termos de pesquisa.
    """
    if not termos_pesquisa:
        return 0.0

    # Preparar texto do produto para busca (normalizado)
    # Usar nova coluna categoria (com fallback para modelo)
    nome_raw = produto.get('nome', '')
    nome = normalize_text(nome_raw)
    categoria = normalize_text(produto.get('categoria', '') or produto.get('modelo', ''))
    descricao = normalize_text(produto.get('descricao', ''))
    tags_raw = produto.get('tags', [])
    if isinstance(tags_raw, list):
        tags_texto = normalize_text(' '.join(str(tag) for tag in tags_raw))
    else:
        tags_texto = normalize_text(str(tags_raw)) if tags_raw else ''
    texto_produto = f"{nome} {categoria} {tags_texto} {descricao}".strip()

    scores_dos_termos: List[float] = []
    for termo in termos_pesquisa:
        termo_norm = normalize_text(termo)
        if not termo_norm:
            continue
        score_frase = 0.0
        # peso maior se frase completa no nome
        if termo_norm in nome:
            score_frase = 0.8
        elif termo_norm in texto_produto:
            score_frase = 0.5

        # tokens individuais (sem stopwords)
        palavras = [p for p in termo_norm.split() if p not in STOPWORDS_PT]
        score_palavras = 0.0
        if palavras:
            matches = sum(1 for p in palavras if p in texto_produto)
            score_palavras = (matches / len(palavras)) * 0.3

        # bônus pequeno para números/unidades presentes
        bonus_num = 0.0
        if re.search(r"(\b\d{2,}\b|\b\d{2,}\s?(ppm|dpi)\b|\ba\d\b|\b\d+x\d+\b)", termo_norm) and re.search(r"(ppm|dpi|a\d|\d+x\d+|\d{2,})", texto_produto):
            bonus_num = 0.1

        score_total_termo = min(1.0, score_frase + score_palavras + bonus_num)
        scores_dos_termos.append(score_total_termo)

    if not scores_dos_termos:
        return 0.0
    return sum(scores_dos_termos) / len(scores_dos_termos)

def calcular_relevancia_textual(produto: dict, query: str):
    """Calcula relevância textual (campos curtos têm mais peso) com normalização."""
    if not query:
        return 0.0

    nome = normalize_text(produto.get('nome', ''))
    # Usar nova coluna categoria (com fallback para modelo)
    categoria = normalize_text(produto.get('categoria', '') or produto.get('modelo', ''))
    descricao = normalize_text(produto.get('descricao', ''))
    tags_raw = produto.get('tags', [])
    if isinstance(tags_raw, list):
        tags_texto = normalize_text(' '.join(str(tag) for tag in tags_raw))
    else:
        tags_texto = normalize_text(str(tags_raw)) if tags_raw else ''

    # usa a query expandida/normalizada
    q = normalize_text(query)
    palavras_raw = q.split()
    palavras = [p for p in palavras_raw if p not in STOPWORDS_PT]
    if not palavras:
        return 0.0

    score_total = 0.0
    for palavra in palavras:
        if palavra in nome:
            score_total += 0.6
        if palavra in categoria:
            score_total += 0.3
        if palavra in tags_texto:
            score_total += 0.25
        if palavra in descricao:
            score_total += 0.1

    score_norm = score_total / max(1, len(palavras))

    # bônus de frase exata
    if q and q in nome:
        score_norm += 0.4
    elif q and q in f"{nome} {categoria} {tags_texto}":
        score_norm += 0.2

    return min(1.0, score_norm)

def buscar_hibrido_ponderado(client: weaviate.WeaviateClient, modelos: dict, query: str, espaco: str, limite: int = 10, filtros: dict = None):
    """Busca híbrida com ponderação (união de candidatos semânticos + BM25 e reranqueamento)."""
    # Monta descrição apenas para logs (filtros serão ponderados, não aplicados na query)
    filtro_desc = f" com filtros ponderados: {filtros}" if filtros else ""
    print(f"\n--- BUSCA HÍBRIDA PONDERADA '{query}' em {espaco}{filtro_desc} ---")
    
    modelo_ativo = modelos.get(espaco)
    if not modelo_ativo:
        print(f"ERRO: Modelo para o espaço '{espaco}' não está carregado.")
        return []

    # 0. Preparos
    vetor_query = modelo_ativo.encode(query)
    collection = client.collections.get("Produtos")
    expanded_query = expand_query_with_synonyms(query)

    # 1. Recuperação de candidatos (semântica + BM25)
    try:
        res_semantica = collection.query.near_vector(
            near_vector=vetor_query,
            target_vector=espaco,
            limit=limite * 3,
            filters=None,
            return_metadata=wvc.query.MetadataQuery(distance=True)
        )
    except Exception as e:
        print(f"Erro na busca semântica: {e}")
        res_semantica = None

    try:
        res_bm25 = collection.query.bm25(
            query=expanded_query,
            query_properties=["nome", "tags", "categoria", "descricao"],
            limit=limite * 3,
            filters=None,
            return_metadata=wvc.query.MetadataQuery(score=True)
        )
    except Exception as e:
        print(f"Erro na busca BM25: {e}")
        res_bm25 = None

    objs_sem = res_semantica.objects if res_semantica and getattr(res_semantica, 'objects', None) else []
    objs_bm = res_bm25.objects if res_bm25 and getattr(res_bm25, 'objects', None) else []

    if not objs_sem and not objs_bm:
        print("Nenhum resultado encontrado.")
        return []
    
    # 2. Ponderação por especialistas
    resultados_finais: Dict[Tuple[str, str], Dict[str, Any]] = {}

    termos_pc = preprocess_termos(filtros.get("palavras_chave")) if filtros else []
    pesos = _detectar_especificidade(query, termos_pc)

    for o in list(objs_sem) + list(objs_bm):
        p = o.properties
        if not p:
            continue
        # Score semântico base (1 - distância), se existir
        dist = getattr(o.metadata, 'distance', None)
        score_semantico = max(0.0, 1.0 - dist) if isinstance(dist, (float, int)) else 0.0

        # Score textual
        score_textual = calcular_relevancia_textual(p, expanded_query)


        # Score de palavras-chave específicas (se fornecidas)
        score_palavras_chave = 0.0
        if termos_pc:
            score_palavras_chave = calcular_relevancia_por_array(p, termos_pc)
        
        # Score de filtros (regras de negócio)
        score_filtro = calcular_score_filtros(p, filtros)
        
        # Fusão com pesos dinâmicos
        score_hibrido = (
            score_semantico * pesos["w_sem"]
            + score_textual * pesos["w_txt"]
            + score_palavras_chave * pesos["w_pc"]
            + score_filtro * pesos["w_flt"]
        )
        
        # boost leve se textual estiver muito alto
        if score_textual > 0.75:
            score_hibrido += 0.03
        score_hibrido = max(0.0, min(1.0, score_hibrido))
    
        # Usar nova coluna categoria (com fallback para modelo)
        categoria_p = p.get('categoria', '') or p.get('modelo', '')
        chave_produto = (p.get('nome'), categoria_p)
        atual = resultados_finais.get(chave_produto)
        if not atual or score_hibrido > atual['score']:
            resultados_finais[chave_produto] = {
                'produto_id': p.get('produto_id'),
                'nome': p.get('nome'),
                'categoria': p.get('categoria') or p.get('modelo'),
                'tags': p.get('tags'),
                'descricao': p.get('descricao'),
                'preco': p.get('preco', 0),
                'estoque': p.get('estoque', 0),
                'score': score_hibrido,
                'score_semantico': score_semantico,
                'score_textual': score_textual,
                'score_palavras_chave': score_palavras_chave,
                'score_filtro': score_filtro
            }

    # 3. Ordenar e limitar
    lista_final = list(resultados_finais.values())
    lista_final.sort(key=lambda x: x['score'], reverse=True)
    lista_final = lista_final[:limite]

    # 4. Exibir resultados
    print(f"\n📊 Encontrados {len(lista_final)} produtos relevantes:")
    for i, r in enumerate(lista_final, 1):
        preco_info = f" | R$ {r.get('preco', 0):.2f}" if r.get('preco') else ""
        sem_pct = int(r['score_semantico'] * 100)
        txt_pct = int(r['score_textual'] * 100)
        pc_pct = int(r.get('score_palavras_chave', 0.0) * 100)
        flt_pct = int(r.get('score_filtro', 0.0) * 100)
        final_pct = int(r['score'] * 100)
        categoria_display = r.get('categoria', '') or r.get('modelo', '')
        print(f"{i:2d}. {r['nome']}")
        print(f"    📈 Score: {final_pct}% (Sem: {sem_pct}% + Txt: {txt_pct}% + PC: {pc_pct}% + Flt: {flt_pct}%)")
    
    return lista_final
