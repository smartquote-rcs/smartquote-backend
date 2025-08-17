import re
import unicodedata
from typing import List, Dict
import sys
import os

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from busca_local.config import SYNONYMS, STOPWORDS_PT

# normalização sem dependências externas pesadas; usa unidecode se existir
try:
    from unidecode import unidecode as _unidecode
except Exception:  # pragma: no cover
    _unidecode = None

def normalize_text(s: str) -> str:
    """Normaliza texto para matching robusto: minúsculas, sem acentos, hífens unificados."""
    if not s:
        return ""
    s = str(s).lower()
    # substituir hífens não-ASCII por '-'
    s = s.replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-").replace("\xad", "-")
    # remover acentos
    if _unidecode:
        s = _unidecode(s)
    else:
        s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    # normalizações específicas
    s = re.sub(r"\bwi\s*[-\s]?\s*fi\b", "wifi", s)
    s = s.replace("–", "-").replace("—", "-")
    s = re.sub(r"[^a-z0-9\-\s]", " ", s)  # remove pontuações exceto hífen
    s = re.sub(r"\s+", " ", s).strip()
    return s

def expand_query_with_synonyms(texto: str) -> str:
    """Expande a query com sinônimos simples para melhorar BM25."""
    base = texto or ""
    base_norm = normalize_text(base)
    extras: List[str] = []
    for k, vals in SYNONYMS.items():
        if k in base_norm:
            extras.extend(vals)
    if not extras:
        return base
    # usa separador " | " para preservar contexto ao usuário e BM25
    return f"{base} | {' | '.join(sorted(set(extras)))}"

def preprocess_termos(termos: List[str] = None) -> List[str]:
    """Divide termos por vírgula/"/" e normaliza espaços; remove vazios."""
    if not termos:
        return []
    out: List[str] = []
    for t in termos:
        if not t:
            continue
        parts = re.split(r"[,/|]", str(t))
        for p in parts:
            p = p.strip()
            if p:
                out.append(p)
    return out

def _detectar_especificidade(query: str, termos: List[str]) -> Dict[str, float]:
    """Define pesos dinâmicos conforme presença de modelo/marca e números com unidades."""
    qn = normalize_text(query)
    all_text = " ".join([qn] + [normalize_text(t) for t in termos])
    # padrões: modelos (mix letra+numero), unidades comuns
    has_model = bool(re.search(r"[a-z]+[\- ]?\d{2,}[a-z0-9\-]*", all_text))
    has_units = bool(re.search(r"(\b\d{2,}\s?(ppm|dpi)\b|\ba\d\b|\b1200x1200\b)", all_text))
    if has_model or has_units:
        return {"w_sem": 0.50, "w_txt": 0.20, "w_pc": 0.25, "w_flt": 0.05}
    return {"w_sem": 0.65, "w_txt": 0.20, "w_pc": 0.10, "w_flt": 0.05}
