from typing import List, Dict, Any, Optional
import sys
import os

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from busca_local.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_TABLE

# Imports para Supabase
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
    print("✅ Supabase disponível")
except ImportError as e:
    print(f"⚠️ Supabase não disponível: {e}")
    print("💡 Execute: pip install supabase")
    SUPABASE_AVAILABLE = False

class SupabaseManager:
    def __init__(self):
        self.supabase = None
        self.produtos = []
        
    def connect(self):
        """Conecta ao Supabase e carrega produtos"""
        if not SUPABASE_AVAILABLE:
            print("❌ Supabase não disponível - instale as dependências")
            return False
            
        try:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            # Testar conexão e carregar produtos
            test_query = self.supabase.table(SUPABASE_TABLE).select("count", count="exact").execute()
            total_produtos = test_query.count if test_query.count else 0
            print(f"✅ Supabase conectado - {total_produtos} produtos encontrados")
            
            # Carregar todos os produtos
            result = self.supabase.table(SUPABASE_TABLE).select("*").execute()
            self.produtos = result.data if result.data else []
            print(f"📊 {len(self.produtos)} produtos carregados do Supabase")
            
            if self.produtos:
                campos_disponiveis = list(self.produtos[0].keys())
                print(f"🔧 Campos disponíveis: {campos_disponiveis}")
            return True
                
        except Exception as e:
            print(f"❌ Erro ao conectar Supabase: {e}")
            self.supabase = None
            return False
            
    def is_available(self) -> bool:
        """Verifica se o cliente Supabase está disponível."""
        return bool(SUPABASE_AVAILABLE and self.supabase is not None)
        
    def get_produtos(self) -> List[Dict[str, Any]]:
        """Retorna lista de produtos carregados"""
        return self.produtos
