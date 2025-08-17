import weaviate
import weaviate.classes as wvc
from sentence_transformers import SentenceTransformer
from typing import Dict, Any
import warnings
import sys
import os

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from busca_local.config import WEAVIATE_HOST, WEAVIATE_PORT, WEAVIATE_GRPC_PORT, MODELO_PT, MODELO_MULTI

warnings.filterwarnings("ignore", category=UserWarning, module="google.protobuf")
warnings.filterwarnings("ignore", category=DeprecationWarning)

class WeaviateManager:
    def __init__(self):
        self.client = None
        self.model_pt = None
        self.model_multi = None
        self.MULTI_OK = False
        
    def connect(self):
        """Conecta ao Weaviate e carrega modelos"""
        print("A conectar ao Weaviate...")
        try:
            self.client = weaviate.connect_to_local(
                host=WEAVIATE_HOST,
                port=WEAVIATE_PORT,
                grpc_port=WEAVIATE_GRPC_PORT,
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
                self.client.collections.delete("Produtos")
                print("Schema 'Produtos' antigo removido.")
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
        """Gera embeddings (pt + multi) e indexa o produto do Supabase."""
        # Mapear campos do Supabase para o texto de embedding
        nome = dados_produto.get('nome', '')
        descricao = dados_produto.get('descricao', '')
        # Usar nova coluna categoria (com fallback para modelo)
        categoria = dados_produto.get('categoria', '') or dados_produto.get('modelo', '')
        tags_raw = dados_produto.get('tags', '')
        
        # Processar tags: converter para array se for string, ou manter como está se já for array
        if isinstance(tags_raw, str):
            tags_array = [tag.strip() for tag in tags_raw.split(',') if tag.strip()] if tags_raw else []
            tags_texto = tags_raw
        elif isinstance(tags_raw, list):
            tags_array = tags_raw
            tags_texto = ', '.join(str(tag) for tag in tags_raw)
        else:
            # Caso seja None ou outro tipo
            tags_array = []
            tags_texto = ''
        
        texto_para_embedding = f"Nome: {nome}. Categoria: {categoria}. Tags: {tags_texto}. Descrição: {descricao}"
        
        print(f"\nIndexando: {nome}")
        emb_pt = self.model_pt.encode(texto_para_embedding)
        print(f"  Vetor PT dim: {len(emb_pt)}")
        emb_multi = self.model_multi.encode(texto_para_embedding) if self.MULTI_OK else None
        if emb_multi is not None:
            print(f"  Vetor MULTI dim: {len(emb_multi)}")
        
        collection = self.client.collections.get("Produtos")
        vectors = {"vetor_portugues": emb_pt}
        if emb_multi is not None:
            vectors["vetor_multilingue"] = emb_multi
        
        # Preparar dados para inserção no Weaviate
        dados_weaviate = {
            "produto_id": int(dados_produto.get('id', 0)),
            "nome": nome,
            "descricao": descricao,
            "preco": float(dados_produto.get('preco', 0)) if dados_produto.get('preco') else 0.0,
            "categoria": categoria,
            "tags": tags_array,  # Enviar como array
            "estoque": int(dados_produto.get('estoque', 0)) if dados_produto.get('estoque') else 0
        }
        
        collection.data.insert(properties=dados_weaviate, vector=vectors)
        print("  ✔ Produto indexado")
        
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
        else:
            # Inserir novo produto
            collection.data.insert(properties=dados_weaviate, vector=vectors)
            print("  ✔ Produto indexado")
        
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
