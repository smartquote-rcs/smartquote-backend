from weaviate_client import WeaviateManager
from weaviate.classes.query import Filter

# Inicializa o gerenciador e conecta
manager = WeaviateManager()
manager.connect()

# Apaga todos os objetos da coleção "Produtos"
collection = manager.client.collections.get("Produtos")
filtro = Filter.by_property("produto_id").greater_than(0)
res = collection.data.delete_many(where=filtro)
print("Todos os objetos apagados:", res)

# Fecha a conexão
manager.close()
