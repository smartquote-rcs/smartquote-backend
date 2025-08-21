from .decomposer import SolutionDecomposer
from .models import (
    DecompositionResult, ComponenteParaAquisicao,
    AlternativaViavel, ComponentPriority
)
from .utils import validate_and_fix_result, create_fallback_decomposition, build_filters

__all__ = [
    'SolutionDecomposer',
    'DecompositionResult',
    'ComponenteParaAquisicao', 
    'AlternativaViavel',
    'ComponentPriority',
    'validate_and_fix_result',
    'create_fallback_decomposition',
    'build_filters'
]
