"""
Arquivo principal para execução do sistema de busca e cotação.
Execute este arquivo para iniciar o modo interativo.
"""
import warnings
from typing import Any, Dict, List, Tuple
import os
import sys
import json
import argparse
from datetime import datetime

# Adicionar o diretório pai ao path para permitir imports relativos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from busca_local.config import LIMITE_PADRAO_RESULTADOS, LIMITE_MAXIMO_RESULTADOS, GROQ_API_KEY
from busca_local.weaviate_client import WeaviateManager
from busca_local.supabase_client import SupabaseManager
from busca_local.search_engine import buscar_hibrido_ponderado, _llm_escolher_indice
from busca_local.query_builder import gerar_estrutura_de_queries
from busca_local.cotacao_manager import CotacaoManager

warnings.filterwarnings("ignore", category=UserWarning, module="google.protobuf")
warnings.filterwarnings("ignore", category=DeprecationWarning)

def executar_estrutura_de_queries(
    weaviate_manager: WeaviateManager, 
    estrutura: List[Dict[str, Any]], 
    limite: int = None, 
    usar_multilingue: bool = True,
    verbose: bool = False
) -> Tuple[Dict[str, List[Dict[str, Any]]], List[str]]:
    """
    Executa todas as queries geradas pela estrutura e apresenta resultados.
    Retorna um dicionário {query_id: [resultados]} e uma lista de IDs de queries faltantes.
    """
    if limite is None:
        limite = LIMITE_PADRAO_RESULTADOS
        
    modelos = weaviate_manager.get_models()
    espacos = ["vetor_portugues"] + (["vetor_multilingue"] if modelos.get("vetor_multilingue") is not None and usar_multilingue else [])

    resultados_por_query: Dict[str, List[Dict[str, Any]]] = {}

    for q in estrutura:
        if verbose:
            print("\n" + "="*60, file=sys.stderr)
            print(f"➡️ Executando {q['id']} [{q['tipo']}] | Query: {q['query']}", file=sys.stderr)
            print(f"Filtros: {q.get('filtros')}", file=sys.stderr)
        todos: List[Dict[str, Any]] = []
        # Buscar em todos os espaços e juntar resultados
        for espaco in espacos:
            r = buscar_hibrido_ponderado(
                weaviate_manager.client,
                modelos,
                q["query"],
                espaco,
                limite=limite,
                filtros=q.get("filtros") or None,
            )
            todos.extend(r)
        # Agregar por produto mantendo melhor score
        agregados: Dict[Tuple[str, str], Dict[str, Any]] = {}
        for item in todos:
            categoria = item.get("categoria", "") or item.get("modelo", "")
            chave = (item["nome"], categoria)
            atual = agregados.get(chave)
            if not atual or item["score"] > atual["score"]:
                agregados[chave] = item
        lista = list(agregados.values())
        lista.sort(key=lambda x: x["score"], reverse=True)

        idx_escolhido = -1
        try:
            idx_escolhido = _llm_escolher_indice(q["query"], q.get("filtros") or None, q.get("custo_beneficio") or None, lista)
        except Exception as e:
            print(f"[LLM] Erro ao executar refinamento: {e}")
            idx_escolhido = -1
        if isinstance(idx_escolhido, int) and 0 <= idx_escolhido < len(lista):
            escolhido = lista[idx_escolhido]
            escolhido["llm_match"] = True
            escolhido["llm_index"] = idx_escolhido
            print(f"🎯 Índice escolhido pela LLM: {idx_escolhido} - {escolhido.get('nome', 'N/A')}")
            lista = [escolhido]
        else:
            print("🎯 Nenhum candidato disponível após refinamento LLM")
            lista = []

        resultados_por_query[q["id"]] = lista

        # Apresentação resumida por query
        if verbose:
            print(f"\n📌 Top {min(limite, len(lista))} para {q['id']}:", file=sys.stderr)
            for i, r in enumerate(lista[:limite], start=1):
                preco_info = f" | R$ {r.get('preco', 0):.2f}" if r.get('preco') else ""
                categoria_display = r.get('categoria', '') or r.get('modelo', '')
                print(f" {i:2d}. {r['nome']} | {categoria_display}{preco_info} | Score {int(r['score']*100)}%", file=sys.stderr)

    # ================== Pós-processamento: queries sem resultado ==================
    ids_por_tipo: Dict[str, str] = {q["id"]: q.get("tipo", "") for q in estrutura}
    item_ids: List[str] = [q["id"] for q in estrutura if q.get("tipo") == "item"]

    # Considerar somente itens (Q1..QN) para determinar faltantes
    missing_items: List[str] = [qid for qid in item_ids if not resultados_por_query.get(qid)]

    faltando: List[str] = missing_items

    if verbose:
        if faltando:
            print("\n⚠️ Queries sem resultados ou pendentes:", file=sys.stderr)
            for qid in faltando:
                qmeta = next((q for q in estrutura if q["id"] == qid), None)
                if qmeta:
                    tipo = qmeta.get("tipo", "")
                    extra = ""
                    if tipo == "item":
                        fonte = qmeta.get("fonte", {}) or {}
                        nome_item = fonte.get("nome") or ""
                        if nome_item:
                            extra = f" - {nome_item}"
                    print(f" - {qid} ({tipo}){extra}", file=sys.stderr)
        else:
            if (has_q0 or has_q1) and not missing_items:
                print("\n✅ Pesquisa completa (núcleo e itens com resultados).", file=sys.stderr)

    return resultados_por_query, faltando

def _resumo_resultados(resultados: Dict[str, List[Dict[str, Any]]], limite: int) -> Dict[str, List[Dict[str, Any]]]:
    """Extrai um resumo compacto dos resultados (Top N por query)."""
    resumo: Dict[str, List[Dict[str, Any]]] = {}
    for qid, lista in resultados.items():
        compact = []
        for r in (lista or [])[:limite]:
            compact.append({
                "nome": r.get("nome"),
                "categoria": r.get("categoria") or r.get("modelo"),
                "preco": r.get("preco"),
                "score": r.get("score"),
                "produto_id": r.get("produto_id"),
                "fonte": r.get("fonte"),
            })
        resumo[qid] = compact
    return resumo


def processar_interpretacao(
    interpretation: Dict[str, Any],
    weaviate_manager: WeaviateManager,
    supabase_manager: SupabaseManager,
    decomposer: Any,
    limite_resultados: int,
    usar_multilingue: bool,
    criar_cotacao: bool = False,
) -> Dict[str, Any]:
    """
    Processa uma interpretação: usa o campo 'solicitacao' para rodar LLM->brief->queries->busca.
    Retorna um dicionário com status, resumo dos resultados e metadados (sem logs no stdout).
    """
    # Campos básicos
    solicitacao = (interpretation or {}).get("solicitacao")
    if not solicitacao:
        raise ValueError("Campo 'solicitacao' ausente na interpretação fornecida")

    # Sincronizar dados antes da busca: se houver novos produtos no Supabase, indexá-los no Weaviate
    try:
        if supabase_manager and supabase_manager.is_available():
            novos = supabase_manager.get_novos_produtos()
            if novos:
                print(f"🔍 Novos produtos detectados no Supabase: {len(novos)}. Indexando...", file=sys.stderr)
                weaviate_manager.sincronizar_com_supabase(novos)
        else:
            # caso não esteja disponível, manter fluxo
            pass
    except Exception as e:
        print(f"⚠️ Falha ao sincronizar com Supabase antes da busca: {e}", file=sys.stderr)

    print("🤖 Decompondo solicitação...", file=sys.stderr)
    brief = decomposer.gerar_brief(solicitacao)

    estrutura = gerar_estrutura_de_queries(brief)
    print(f"🧩 {len(estrutura)} queries geradas a partir do brief", file=sys.stderr)

    resultados, faltantes = executar_estrutura_de_queries(
        weaviate_manager,
        estrutura,
        limite=limite_resultados,
        usar_multilingue=usar_multilingue,
        verbose=False,  # manter stdout limpo
    )

    # Mapear metadados das queries para facilitar detalhes dos faltantes
    meta_por_id = {q["id"]: q for q in estrutura}
    faltantes_meta: Dict[str, Any] = {}
    for qid in faltantes:
        qm = meta_por_id.get(qid)
        if not qm:
            continue
        filtros = qm.get("filtros") or {}
        fonte = qm.get("fonte") or {}
        # Nome amigável: item.nome, alternativa.nome ou solucao_principal
        nome_amigavel = fonte.get("nome") or fonte.get("solucao_principal") or None
        faltantes_meta[qid] = {
            "id": qm.get("id"),
            "tipo": qm.get("tipo"),
            "nome": nome_amigavel,
            "query": qm.get("query"),
            "custo_beneficio": filtros.get("custo_beneficio"),
            "categoria": filtros.get("categoria"),
            "palavras_chave": filtros.get("palavras_chave"),
            "quantidade": qm.get("quantidade"),
            "fonte": fonte,  # mantém contexto original (tags, prioridade, etc.)
        }

    # Gerar tarefas para pesquisa web com base nos faltantes
    tarefas_web: List[Dict[str, Any]] = []
    for qid, meta in faltantes_meta.items():
        nome = (meta.get("nome") or "").strip()
        categoria = (meta.get("categoria") or "").strip()
        palavras = meta.get("palavras_chave") or []
        custo_beneficio = meta.get("custo_beneficio") or {} 
        if isinstance(palavras, list):
            palavras_str = " ".join([str(p).strip() for p in palavras if str(p).strip()])
        else:
            palavras_str = str(palavras).strip()
        base = " ".join([s for s in [nome] if s])
        # fallback para query original se base ficar vazia
        query_sugerida = base if base else (meta.get("query") or nome or categoria)
        query_sugerida = (query_sugerida or "").strip()
        tarefas_web.append({
            "id": qid,
            "tipo": meta.get("tipo"),
            "nome": nome or None,
            "categoria": categoria or None,
            "custo_beneficio": custo_beneficio,
            "palavras_chave": palavras or None,
            "quantidade": meta.get("quantidade") or 1,
            "query_sugerida": query_sugerida or None,
        })

    saida: Dict[str, Any] = {
        "status": "success",
        "processed_at": datetime.now().isoformat(),
        "email_id": interpretation.get("emailId"),
        "interpretation_id": interpretation.get("id"),
        "tipo": interpretation.get("tipo"),
        "prioridade": interpretation.get("prioridade"),
        "confianca": interpretation.get("confianca"),
        "dados_extraidos": brief,  # Incluir o JSON estruturado do LLM
        "faltantes": tarefas_web,
        "resultado_resumo": _resumo_resultados(resultados, limite_resultados),
    }

    # Criação opcional de cotações, seguindo as regras do fluxo anterior (sem prompt)
    if criar_cotacao:
        print("\n⚙️ Criando cotações (modo automático)...", file=sys.stderr)
        cotacao_manager = CotacaoManager(supabase_manager)

        prompt_id = cotacao_manager.insert_prompt(
            texto_original=solicitacao,
            dados_extraidos=brief,
            origem={"tipo": "servico", "fonte": "stdin"},
            status="analizado",
        )
        if not prompt_id:
            print("❌ Não foi possível criar o prompt; pulando cotações.", file=sys.stderr)
            saida["cotacoes"] = {"status": "erro", "motivo": "prompt_invalido"}
            return saida

        tem_q0 = bool(resultados.get("Q0"))

        if tem_q0:
            ids_primeira = ["Q0"] + [
                qid for qid, meta in meta_por_id.items()
                if meta.get("tipo") == "item" and qid != "Q1"
            ]
        else:
            ids_primeira = [qid for qid, meta in meta_por_id.items() if meta.get("tipo") == "item"]

        cotacao1_id = cotacao_manager.insert_cotacao(
            prompt_id=prompt_id,
            faltantes=tarefas_web if tarefas_web else None,
            observacoes="Cotação principal (automática).",
        )

        itens_adicionados = 0
        produtos_principais = set()  # Conjunto para armazenar IDs dos produtos já adicionados na cotação principal
        
        if cotacao1_id:
            for qid in ids_primeira:
                res_list = resultados.get(qid) or []
                if not res_list:
                    continue
                top_resultado = res_list[0]
                produto_id_local = top_resultado.get("produto_id")
                if not produto_id_local:
                    print(
                        f"⚠️ Item '{top_resultado.get('nome')}' da query '{qid}' sem ID de produto. Pulando.",
                        file=sys.stderr,
                    )
                    continue

                meta_q = meta_por_id.get(qid, {}) or {}
                quantidade = int(meta_q.get("quantidade", 1) or 1)
                if quantidade <= 0:
                    quantidade = 1

                if cotacao_manager.check_cotacao_item_exists(cotacao1_id, produto_id_local):
                    print(
                        f"⚠️ Produto '{top_resultado.get('nome')}' já existe na cotação. Pulando duplicata.",
                        file=sys.stderr,
                    )
                    continue

                item_id = cotacao_manager.insert_cotacao_item_from_result(
                    cotacao_id=cotacao1_id,
                    resultado_produto=top_resultado,
                    origem="local",
                    produto_id=produto_id_local,
                    payload={"query_id": qid, "score": top_resultado.get("score"), "alternativa": False},
                    quantidade=quantidade,
                )
                if item_id:
                    itens_adicionados += 1
                    produtos_principais.add(produto_id_local)  # Adicionar produto ao conjunto

        alternativas_ids: List[str] = []
        alternativas = [qid for qid, meta in meta_por_id.items() if meta.get("tipo") == "alternativa"]
        for qid in alternativas:
            res_list = resultados.get(qid) or []
            if not res_list:
                continue
            top_resultado = res_list[0]
            produto_id_local = top_resultado.get("produto_id")
            nome_alt = meta_por_id.get(qid, {}).get("fonte", {}).get("nome") or top_resultado.get("nome", "")

            # Verificar se o produto da alternativa já está na cotação principal
            if produto_id_local in produtos_principais:
                print(
                    f"⚠️ Alternativa '{nome_alt}' com produto '{top_resultado.get('nome')}' já está na cotação principal. Pulando.",
                    file=sys.stderr,
                )
                continue

            cotacao_alt_id = cotacao_manager.insert_cotacao(
                prompt_id=prompt_id,
                observacoes=f"Cotação alternativa - {nome_alt}",
                condicoes={"tipo": "alternativa", "query_id": qid},
            )
            if not cotacao_alt_id:
                print(f"❌ Falha ao criar cotação alternativa para '{nome_alt}'.", file=sys.stderr)
                continue

            if not produto_id_local:
                print(f"⚠️ Alternativa '{top_resultado.get('nome')}' sem ID de produto. Pulando.", file=sys.stderr)
                continue

            item_id = cotacao_manager.insert_cotacao_item_from_result(
                cotacao_id=cotacao_alt_id,
                resultado_produto=top_resultado,
                origem="local",
                produto_id=produto_id_local,
                payload={"query_id": qid, "score": top_resultado.get("score"), "alternativa": True},
            )
            if item_id:
                alternativas_ids.append(str(cotacao_alt_id))

        saida["cotacoes"] = {
            "principal_id": cotacao1_id,
            "itens_adicionados": itens_adicionados,
            "alternativas_ids": alternativas_ids,
        }

    return saida
def main():
    """CLI: lê JSON via stdin, usa 'solicitacao' e executa o pipeline. Suporta modo servidor."""
    parser = argparse.ArgumentParser(description="smartQuote - processamento de solicitações via JSON")
    parser.add_argument("--server", action="store_true", help="Executa em modo servidor (uma linha = um JSON)")
    parser.add_argument("--limite", type=int, default=LIMITE_PADRAO_RESULTADOS, help="Limite de resultados por query")
    parser.add_argument("--no-multilingue", dest="no_multilingue", action="store_true", help="Desativa vetor multilingue")
    parser.add_argument("--criar-cotacao", action="store_true", help="Cria cotações automaticamente quando houver resultados")
    args = parser.parse_args()

    limite = args.limite
    if limite < 1 or limite > LIMITE_MAXIMO_RESULTADOS:
        print(
            f"⚠️ Limite inválido: {limite}. Usando padrão {LIMITE_PADRAO_RESULTADOS}",
            file=sys.stderr,
        )
        limite = LIMITE_PADRAO_RESULTADOS

    usar_multilingue = not args.no_multilingue

    # Inicializar managers
    weaviate_manager = WeaviateManager()
    supabase_manager = SupabaseManager()

    try:
        # Conectar Weaviate
        weaviate_manager.connect()

        # Conectar Supabase
        if not supabase_manager.connect():
            print("⚠️ Continuando sem Supabase", file=sys.stderr)

        # Definir schema e indexar produtos
        weaviate_manager.definir_schema()

        produtos = supabase_manager.get_produtos()
        if produtos:
            print(f"🔄 Indexando {len(produtos)} produtos do Supabase...", file=sys.stderr)
            produtos_indexados = 0
            for produto in produtos:
                try:
                    weaviate_manager.indexar_produto(produto)
                    produtos_indexados += 1
                except Exception as e:
                    print(
                        f"❌ Erro ao indexar produto {produto.get('nome', 'sem nome')}: {e}",
                        file=sys.stderr,
                    )

            print(
                f"✅ Indexação concluída: {produtos_indexados}/{len(produtos)} produtos",
                file=sys.stderr,
            )
        else:
            print("⚠️ Nenhum produto encontrado no Supabase", file=sys.stderr)
            print("💡 Verifique a conexão com o banco de dados", file=sys.stderr)

        # Inicializa Decomposer (GROQ)
        from busca_local.decomposer import SolutionDecomposer

        api_key = os.environ.get("GROQ_API_KEY", GROQ_API_KEY)
        if not api_key:
            print("❌ GROQ_API_KEY não definida no ambiente.", file=sys.stderr)
            print(json.dumps({
                "status": "error",
                "error": "GROQ_API_KEY ausente",
                "processed_at": datetime.now().isoformat(),
            }))
            return

        decomposer = SolutionDecomposer(api_key)

        def handle_one(payload: Dict[str, Any]) -> Dict[str, Any]:
            # Compat: aceitar envelope { rid, interpretation } ou o próprio objeto de interpretação
            interpretation = payload.get("interpretation") if isinstance(payload, dict) and "interpretation" in payload else payload
            return processar_interpretacao(
                interpretation=interpretation,
                weaviate_manager=weaviate_manager,
                supabase_manager=supabase_manager,
                decomposer=decomposer,
                limite_resultados=limite,
                usar_multilingue=usar_multilingue,
                criar_cotacao=args.criar_cotacao,
            )

        if args.server:
            print("🐍 [PYTHON] Servidor iniciado (linha por tarefa)", file=sys.stderr)
            for line in sys.stdin:
                line = line.strip()
                if not line:
                    continue
                try:
                    envelope = json.loads(line)
                    rid = envelope.get("rid")
                    result = handle_one(envelope)
                    if rid:
                        result["rid"] = rid
                    print(json.dumps(result, ensure_ascii=False), flush=True)
                except json.JSONDecodeError as e:
                    err = {
                        "status": "error",
                        "error": f"JSON parse error: {str(e)}",
                        "processed_at": datetime.now().isoformat(),
                    }
                    print(json.dumps(err, ensure_ascii=False), flush=True)
                except Exception as e:
                    err = {
                        "status": "error",
                        "error": f"Unexpected error: {str(e)}",
                        "processed_at": datetime.now().isoformat(),
                    }
                    print(json.dumps(err, ensure_ascii=False), flush=True)
        else:
            # Modo single-shot: lê JSON completo do stdin
            input_data = sys.stdin.read().strip()
            if not input_data:
                print("❌ [PYTHON] Nenhum dado recebido via stdin", file=sys.stderr)
                sys.exit(1)
            try:
                payload = json.loads(input_data)
            except json.JSONDecodeError as e:
                print(f"❌ [PYTHON] Erro ao fazer parse do JSON: {e}", file=sys.stderr)
                print(json.dumps({
                    "status": "error",
                    "error": f"JSON parse error: {str(e)}",
                    "processed_at": datetime.now().isoformat(),
                }))
                sys.exit(1)

            try:
                result = handle_one(payload)
                print(json.dumps(result, ensure_ascii=False))
            except Exception as e:
                print(f"❌ [PYTHON] Erro inesperado: {e}", file=sys.stderr)
                print(json.dumps({
                    "status": "error",
                    "error": f"Unexpected error: {str(e)}",
                    "processed_at": datetime.now().isoformat(),
                }))
                sys.exit(1)

    finally:
        weaviate_manager.close()
        print("\nConexão fechada.", file=sys.stderr)

if __name__ == "__main__":
    main()
