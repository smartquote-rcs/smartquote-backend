from typing import Dict, List, Any
from .models import (
    DecompositionResult, ComponenteParaAquisicao, RequisitosDoProduto, 
    AlternativaViavel, ComponentPriority, EstrategiaBusca
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
    # Garante que o orçamento tem as chaves corretas
    if isinstance(result.orcamento_estimado_range, dict):
        if 'minimo' not in result.orcamento_estimado_range:
            result.orcamento_estimado_range['minimo'] = 100000
        if 'maximo' not in result.orcamento_estimado_range:
            result.orcamento_estimado_range['maximo'] = 1000000
    else:
        result.orcamento_estimado_range = {"minimo": 100000, "maximo": 1000000}
    
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
    
    # Garante que existe pelo menos uma alternativa viável
    if not result.alternativas_viaveis:
        result.alternativas_viaveis = [
            AlternativaViavel(
                nome="alternativa_padrao",
                tipo="substituto",
                vantagens=["Disponibilidade garantida", "Menor risco"],
                limitacoes=["Especificações a definir"],
                cenario_recomendado="Quando solução principal não estiver disponível",
                economia_estimada=0.0
            )
        ]
    
    # Garante que existe pelo menos uma recomendação
    if not result.preferencias_usuario:
        result.preferencias_usuario = ["Definir especificações mais detalhadas"]
    
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
        alternativas_viaveis=[
            AlternativaViavel(
                nome="alternativa_generica",
                tipo="substituto",
                vantagens=["Menor custo"],
                limitacoes=["Especificações a definir"],
                cenario_recomendado="Quando solução principal não disponível",
                economia_estimada=0.0
            )
        ],
        orcamento_estimado_range={"minimo": 100000, "maximo": 1000000},
        prazo_implementacao_dias=30,
        preferencias_usuario=["Definir especificações mais detalhadas"],
        estrategia_busca=EstrategiaBusca.GLOBAL
    )
