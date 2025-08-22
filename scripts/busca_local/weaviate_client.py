import weaviate
import weaviate.classes as wvc
from sentence_transformers import SentenceTransformer
from typing import Dict, Any
import warnings
import sys
import os

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from busca_local.config import WEAVIATE_HOST, WEAVIATE_PORT, API_KEY_WEAVIATE, MODELO_PT, MODELO_MULTI

warnings.filterwarnings("ignore", category=UserWarning, module="google.protobuf")
warnings.filterwarnings("ignore", category=DeprecationWarning)

class WeaviateManager:
    def __init__(self):
        self.client = None
        self.model_pt = None
        self.model_multi = None
        self.MULTI_OK = False
        # cache leve opcional de ids já indexados, para reduzir consultas repetidas
        self._known_ids: set[int] = set()
        
    def connect(self):
        """Conecta ao Weaviate e carrega modelos"""
        print("A conectar ao Weaviate...")
        try:
            self.client = weaviate.connect_to_weaviate_cloud(
                cluster_url="ylwtqkqjsfstdhecszyr5a.c0.us-west3.gcp.weaviate.cloud",  # URL do cluster no WCS
                auth_credentials=wvc.init.Auth.api_key(API_KEY_WEAVIATE),
                additional_config=wvc.init.AdditionalConfig(
                    timeout=wvc.init.Timeout(init=60, query=60, insert=180)
                )
            )
            print("Conectado ao Weaviate v4 (REST+gRPC)")
        except Exception as e:
            print(f"Erro na conexão: {e}")
            raise
            
        print("A carregar os modelos de embedding... (isto pode demorar na primeira vez)")
        self.model_pt = SentenceTransformer(MODELO_PT)
        try:
            self.model_multi = SentenceTransformer(MODELO_MULTI)
            self.MULTI_OK = True
        except Exception as e:
            print(f"Falha ao carregar modelo multilíngue: {e}. Prosseguindo só com PT.")
            self.MULTI_OK = False
        print("Modelos carregados.")
        
    def definir_schema(self):
        """Cria a classe 'Produtos' com vetores baseada nos dados do Supabase."""
        from weaviate.classes.config import Configure, Property, DataType
        try:
            if self.client.collections.exists("Produtos"):
                # Já existe: reutiliza a coleção existente para evitar 422
                print("Schema 'Produtos' já existe. Reutilizando coleção existente.")
                return
            else:
                print("Criando novo schema...")
        except Exception as e:
            print(f"Aviso ao limpar schema: {e}")
        
        # Schema baseado nos campos do Supabase
        self.client.collections.create(
            name="Produtos",
            properties=[
                Property(name="produto_id", data_type=DataType.INT),
                Property(name="nome", data_type=DataType.TEXT),
                Property(name="descricao", data_type=DataType.TEXT),
                Property(name="preco", data_type=DataType.NUMBER),
                Property(name="categoria", data_type=DataType.TEXT),
                Property(name="tags", data_type=DataType.TEXT_ARRAY),
                Property(name="estoque", data_type=DataType.INT),
            ],
            vectorizer_config=[
                Configure.NamedVectors.none(name="vetor_portugues"),
                Configure.NamedVectors.none(name="vetor_multilingue")
            ]
        )
        print("Schema 'Produtos' criado com dois vetores nomeados.")
        
    def indexar_produto(self, dados_produto: dict):
        """
        Indexa ou atualiza produto no Weaviate conforme o fluxo inteligente:
        - Se não existe, insere com embeddings.
        - Se existe, compara campos importantes.
          - Se texto mudou, atualiza tudo e recalcula embeddings.
          - Se só mudou preço/estoque, atualiza apenas esses campos.
        """
        import uuid
        produto_id = int(dados_produto.get('id') or dados_produto.get('produto_id') or 0)
        if not produto_id:
            print("Produto sem id, ignorado.")
            return
        uuid_produto = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"produto-{produto_id}"))
        collection = self.client.collections.get("Produtos")
        filtro = wvc.query.Filter.by_property("produto_id").equal(produto_id)
        res = collection.query.fetch_objects(
            limit=1,
            filters=filtro,
            return_properties=["produto_id", "nome", "descricao", "categoria", "tags", "preco", "estoque"],
        )
        objeto_existente = res.objects[0] if res and getattr(res, "objects", None) else None
        nome = dados_produto.get('nome', '')
        descricao = dados_produto.get('descricao', '')
        categoria = dados_produto.get('categoria', '') or dados_produto.get('modelo', '')
        tags_raw = dados_produto.get('tags', '')
        if isinstance(tags_raw, str):
            tags_array = [tag.strip() for tag in tags_raw.split(',') if tag.strip()] if tags_raw else []
        elif isinstance(tags_raw, list):
            tags_array = tags_raw
        else:
            tags_array = []
        preco = float(dados_produto.get('preco', 0)) if dados_produto.get('preco') else 0.0
        estoque = int(dados_produto.get('estoque', 0)) if dados_produto.get('estoque') else 0
        if not objeto_existente:
            texto_para_embedding = f"Nome: {nome}. Categoria: {categoria}. Tags: {', '.join(tags_array)}. Descrição: {descricao}"
            emb_pt = self.model_pt.encode(texto_para_embedding)
            emb_multi = self.model_multi.encode(texto_para_embedding) if self.MULTI_OK else None
            vectors = {"vetor_portugues": emb_pt}
            if emb_multi is not None:
                vectors["vetor_multilingue"] = emb_multi
            dados_weaviate = {
                "produto_id": produto_id,
                "nome": nome,
                "descricao": descricao,
                "preco": preco,
                "categoria": categoria,
                "tags": tags_array,
                "estoque": estoque
            }
            collection.data.insert(uuid=uuid_produto, properties=dados_weaviate, vector=vectors)
            print(f"✔ Produto novo indexado: {nome} (id={produto_id})")
            self._known_ids.add(produto_id)
            return
        atual = objeto_existente.properties
        mudou_texto = (
            atual.get("nome", "") != nome or
            atual.get("descricao", "") != descricao or
            atual.get("categoria", "") != categoria or
            atual.get("tags", []) != tags_array
        )
        mudou_numerico = (
            atual.get("preco", 0.0) != preco or
            atual.get("estoque", 0) != estoque
        )
        if mudou_texto:
            texto_para_embedding = f"Nome: {nome}. Categoria: {categoria}. Tags: {', '.join(tags_array)}. Descrição: {descricao}"
            emb_pt = self.model_pt.encode(texto_para_embedding)
            emb_multi = self.model_multi.encode(texto_para_embedding) if self.MULTI_OK else None
            vectors = {"vetor_portugues": emb_pt}
            if emb_multi is not None:
                vectors["vetor_multilingue"] = emb_multi
            dados_weaviate = {
                "produto_id": produto_id,
                "nome": nome,
                "descricao": descricao,
                "preco": preco,
                "categoria": categoria,
                "tags": tags_array,
                "estoque": estoque
            }
            collection.data.update(uuid=uuid_produto, properties=dados_weaviate, vector=vectors)
            print(f"✏️ Produto atualizado (texto mudou): {nome} (id={produto_id})")
        elif mudou_numerico:
            dados_update = {
                "preco": preco,
                "estoque": estoque
            }
            collection.data.update(uuid=uuid_produto, properties=dados_update)
            print(f"✏️ Produto atualizado (só preço/estoque): {nome} (id={produto_id})")
        else:
            print(f"⏩ Produto já está atualizado: {nome} (id={produto_id})")

    def remover_orfaos(self, valid_produto_ids: set[int]) -> dict:
        """Remove objetos em Weaviate cujo produto_id não existe na base relacional.
        Retorna métricas: { 'removidos': int, 'falhas': int, 'total_encontrados': int }
        """
        import sys
        removidos, falhas, total = 0, 0, 0
        try:
            collection = self.client.collections.get("Produtos")
        except Exception as e:
            print(f"⚠️ Falha ao obter coleção 'Produtos' para limpeza: {e}")
            return {"removidos": 0, "falhas": 1, "total_encontrados": 0}

        # Paginação usando cursor 'after'
        after: str | None = None
        while True:
            try:
                res = collection.query.fetch_objects(
                    limit=100,
                    after=after,
                    return_properties=["produto_id"],
                )
            except Exception as e:
                print(f"⚠️ Erro ao paginar objetos na limpeza: {e}", file=sys.stderr)
                break

            objetos = getattr(res, "objects", None) or []
            if not objetos:
                break

            for obj in objetos:
                total += 1
                try:
                    pid = obj.properties.get("produto_id") if hasattr(obj, "properties") else None
                    uuid_obj = getattr(obj, "uuid", None) or getattr(obj, "id", None)
                    if pid is None or int(pid) not in valid_produto_ids:
                        if uuid_obj is None:
                            # Fallback para reconstruir UUID determinístico se possível
                            import uuid as _uuid
                            try:
                                if pid is not None:
                                    uuid_obj = str(_uuid.uuid5(_uuid.NAMESPACE_DNS, f"produto-{int(pid)}"))
                            except Exception:
                                uuid_obj = None
                        try:
                            if uuid_obj is not None:
                                collection.data.delete_by_id(uuid=uuid_obj)
                                removidos += 1
                            else:
                                falhas += 1
                        except Exception as e:
                            falhas += 1
                            print(f"❌ Falha ao remover objeto órfão (produto_id={pid}): {e}", file=sys.stderr)
                except Exception as e:
                    falhas += 1
                    print(f"⚠️ Erro ao avaliar objeto na limpeza: {e}", file=sys.stderr)

            # Próxima página
            after = getattr(res, "next_page_cursor", None)
            if not after:
                break

        if removidos:
            print(f"🧹 Limpeza Weaviate: removidos {removidos} objeto(s) órfão(s).", file=sys.stderr)
        return {"removidos": removidos, "falhas": falhas, "total_encontrados": total}

    def produto_existe(self, produto_id: int) -> bool:
        """Verifica se já existe um objeto com o produto_id dado no Weaviate."""
        try:
            if produto_id in self._known_ids:
                return True
            collection = self.client.collections.get("Produtos")
            filtro = wvc.query.Filter.by_property("produto_id").equal(produto_id)
            res = collection.query.fetch_objects(
                limit=1,
                filters=filtro,
                return_properties=["produto_id"],
            )
            existe = bool(res and getattr(res, "objects", None))
            if existe:
                self._known_ids.add(int(produto_id))
            return existe
        except Exception as e:
            print(f"⚠️ Falha ao verificar existência do produto {produto_id} no Weaviate: {e}")
            # Em caso de erro na checagem, considerar que não existe para tentar indexar
            return False

    def sincronizar_com_supabase(self, produtos_supabase: list[dict]) -> dict:
        """Sincroniza: garante que Weaviate reflita o Supabase em tempo de execução.
        Ações:
        - Remove objetos cujo produto_id não existe na lista fornecida
        - Indexa produtos que ainda não existem
        Retorna métricas: { 'novos': int, 'removidos': int, 'falhas': int }
        """
        if not produtos_supabase:
            # Segurança: não remover tudo quando a lista vier vazia
            return {"novos": 0, "removidos": 0, "falhas": 0}
        novos, falhas, removidos = 0, 0, 0

        # Purga de órfãos baseada nos IDs atuais do Supabase
        try:
            valid_ids = {int(p.get("id") or p.get("produto_id") or 0) for p in produtos_supabase if (p.get("id") or p.get("produto_id"))}
        except Exception:
            valid_ids = set()
        try:
            if valid_ids:
                res_cleanup = self.remover_orfaos(valid_ids)
                removidos = int(res_cleanup.get("removidos", 0))
        except Exception as e:
            print(f"⚠️ Falha ao remover órfãos durante sincronização: {e}")

        # Indexar o que faltar
        for p in produtos_supabase:
            try:
                pid = int(p.get("id") or p.get("produto_id") or 0)
            except Exception:
                pid = 0
            if not pid:
                # sem id, não indexar
                continue
            if self.produto_existe(pid):
                continue
            try:
                self.indexar_produto(p)
                novos += 1
            except Exception as e:
                falhas += 1
                nome = p.get('nome', 'sem nome')
                print(f"❌ Erro ao indexar novo produto '{nome}' (id={pid}): {e}")
        if novos or removidos:
            print(f"🔄 Sincronização: {novos} novo(s) indexado(s), {removidos} removido(s).")
        return {"novos": novos, "removidos": removidos, "falhas": falhas}
        
    def get_models(self) -> Dict[str, Any]:
        """Retorna dicionário com modelos carregados"""
        return {
            "vetor_portugues": self.model_pt,
            "vetor_multilingue": self.model_multi if self.MULTI_OK else None,
        }
        
    def close(self):
        """Fecha conexão com Weaviate"""
        if self.client:
            self.client.close()
