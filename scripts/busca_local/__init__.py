from .decomposer import SolutionDecomposer
from .models import (
    DecompositionResult, ComponenteParaAquisicao, RequisitosDoProduto,
    AlternativaViavel, ComponentPriority, EstrategiaBusca
)
from .utils import validate_and_fix_result, create_fallback_decomposition, build_filters

__all__ = [
    'SolutionDecomposer',
    'DecompositionResult',
    'ComponenteParaAquisicao', 
    'RequisitosDoProduto',
    'AlternativaViavel',
    'ComponentPriority',
    'EstrategiaBusca',
    'validate_and_fix_result',
    'create_fallback_decomposition',
    'build_filters'
]
