import os
from pathlib import Path

# Carregar variáveis de ambiente do arquivo .env se existir
def load_env():
    """Carrega variáveis de ambiente do arquivo .env"""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ.setdefault(key.strip(), value.strip())
        except Exception as e:
            print(f"⚠️ Erro ao carregar .env: {e}")

# Carregar .env antes de definir configurações
load_env()

# --- CONFIGURAÇÃO SUPABASE ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tkfmjqwjgacngabgzubj.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZm1qcXdqZ2FjbmdhYmd6dWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc0MjUsImV4cCI6MjA3MDM0MzQyNX0.r1iFQJguowfjZZ7pNOVsxDGdvPxS_8N6wilaEOv5c1o")
SUPABASE_TABLE = "produtos"

# --- CONFIGURAÇÃO WEAVIATE ---
WEAVIATE_HOST = "localhost"
WEAVIATE_PORT = 8080
WEAVIATE_GRPC_PORT = 50051

# --- CONFIGURAÇÃO DE BUSCA ---
LIMITE_PADRAO_RESULTADOS = 1
LIMITE_MAXIMO_RESULTADOS = 50

# --- MODELOS DE EMBEDDING ---
MODELO_PT = 'neuralmind/bert-base-portuguese-cased'
MODELO_MULTI = 'paraphrase-multilingual-mpnet-base-v2'

# --- CONFIGURAÇÃO GROQ ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# --- SINÔNIMOS E EQUIVALÊNCIAS ---
SYNONYMS = {
    "impressora": ["printer", "mfp", "multifuncional"],
    "multifuncional": ["mfp"],
    "sem fio": ["wireless", "wifi", "wi-fi"],
    "cartucho": ["toner", "tinta"],
    "duplex": ["frente e verso"],
}

CATEGORY_EQUIV = {
    "hardware de posto de trabalho": [
        "perifericos",
        "informática", 
        "computadores",
        "hardware",
    ],
    "software de produtividade e colaboração": [
        "software",
        "produtividade",
    ],
    "servico": ["servico", "cloud", "suporte"],
}

STOPWORDS_PT = {'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'e', 'ou', 'para', 'com', 'em', 'no', 'na'}
