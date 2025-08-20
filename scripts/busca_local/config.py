import os
from pathlib import Path

# Carregar variáveis de ambiente do arquivo .env se existir
def load_env():
    """Carrega variáveis de ambiente do arquivo .env"""
    # procura .env na raiz do repo (3 níveis acima) e, se não existir, usa local
    root_env = Path(__file__).parent.parent.parent / '.env'
    local_env = Path(__file__).parent / '.env'
    env_file = root_env if root_env.exists() else local_env
    if env_file.exists():
        try:
            print(f"🔎 Carregando .env de: {env_file}")
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ.setdefault(key.strip(), value.strip())
        except Exception as e:
            print(f"⚠️ Erro ao carregar .env: {e}")
    else:
        print("⚠️ Arquivo .env não encontrado (raiz ou local)")

# Carregar .env antes de definir configurações
load_env()

# --- CONFIGURAÇÃO SUPABASE ---
# Preferir SERVICE_ROLE; cair para SUPABASE_KEY ou SUPABASE_ANON_KEY
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
)
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:2000")
SUPABASE_TABLE = "produtos"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Variáveis do Supabase ausentes. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou ANON).")

# --- CONFIGURAÇÃO WEAVIATE ---
WEAVIATE_HOST = "localhost"
WEAVIATE_PORT = 8080
WEAVIATE_GRPC_PORT = 50051

# --- CONFIGURAÇÃO DE BUSCA ---
LIMITE_PADRAO_RESULTADOS = 5
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