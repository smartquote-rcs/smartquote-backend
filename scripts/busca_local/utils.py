from typing import Dict, List, Any
from .models import (
    DecompositionResult, ComponenteParaAquisicao,
    ComponentPriority
)

def build_filters(specs: Dict[str, Any]) -> List[Dict]:
    """Constrói filtros Elasticsearch baseado nas especificações"""
    filters = []
    
    for key, value in specs.items():
        if isinstance(value, list):
            filters.append({"terms": {key: value}})
        elif isinstance(value, (int, float)):
            filters.append({"range": {key: {"gte": value}}})
        elif isinstance(value, str):
            filters.append({"term": {key: value}})
    
    return filters

def validate_and_fix_result(result: DecompositionResult) -> DecompositionResult:
    """Valida e corrige o resultado para garantir consistência"""
    
    # Garante que existe pelo menos um componente
    if not result.itens_a_comprar:
        result.itens_a_comprar = [
            ComponenteParaAquisicao(
                nome="componente_base",
                natureza_componente="hardware",
                prioridade=ComponentPriority.ALTA,
                categoria="Hardware de Servidores e Storage",
                especificacoes_minimas={"tipo": "a_definir"},
                justificativa="Componente básico identificado"
            )
        ]
     
  
    # Garante que campos obrigatórios têm valores válidos
    if not hasattr(result, 'tipo_de_solucao') or not result.tipo_de_solucao:
        result.tipo_de_solucao = "produto"
    
    if not hasattr(result, 'prazo_implementacao_dias') or not result.prazo_implementacao_dias:
        result.prazo_implementacao_dias = 30
    
    return result

def create_fallback_decomposition(main_request: str) -> DecompositionResult:
    """Decomposição de fallback quando a API falha"""
    return DecompositionResult(
        solucao_principal="Solução tecnológica não especificada",
        tipo_de_solucao="produto",
        complexidade_estimada="medio",
        itens_a_comprar=[
            ComponenteParaAquisicao(
                nome="componente_principal",
                natureza_componente="hardware",
                prioridade=ComponentPriority.ALTA,
                categoria="Hardware de Servidores e Storage",
                especificacoes_minimas={"tipo": "a_definir"},
                justificativa="Componente identificado por fallback"
            )
        ],
    )
