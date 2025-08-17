from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class ComponentPriority(str, Enum):
    CRITICA = "critica"
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"

class ComponenteParaAquisicao(BaseModel):
    nome: str = Field(description="Nome do componente")
    natureza_componente: str = Field(description="natureza_componente do componente (hardware, software, servico)")
    prioridade: ComponentPriority = Field(description="Prioridade do componente")
    categoria: str = Field(description="Categoria")
    especificacoes_minimas: Dict[str, Any] = Field(description="Especificações técnicas mínimas")
    justificativa: str = Field(description="Por que este componente é necessário")
    tags: List[str] = Field(default=[], description="Tags relacionadas a este componente")
    alternativas: List[str] = Field(default=[], description="Alternativas viáveis para este componente")
    quantidade: int = Field(default=1, description="Quantidade necessária deste componente")

class RequisitosDoProduto(BaseModel):
    nome: str = Field(description="Nome da característica ou componente embutido")
    natureza_componente: str = Field(description="natureza_componente do requisito (hardware, software, servico)")
    nivel_de_exigencia: ComponentPriority = Field(description="Nível de exigência do requisito")
    especificacoes_minimas: Dict[str, Any] = Field(description="Especificações técnicas mínimas")
    justificativa: str = Field(description="Por que este requisito é necessário")
    restricoes_tecnicas: List[str] = Field(default=[], description="Restrições técnicas específicas")
    variacoes_aceitaveis: List[str] = Field(default=[], description="Variações aceitáveis para este requisito")

class AlternativaViavel(BaseModel):
    nome: str = Field(description="Nome da alternativa")
    tipo: str = Field(description="Tipo de alternativa")
    vantagens: List[str] = Field(description="Vantagens desta alternativa")
    limitacoes: List[str] = Field(description="Limitações ou desvantagens")
    cenario_recomendado: str = Field(description="Quando usar esta alternativa")
    economia_estimada: Optional[float] = Field(description="% de economia estimada")

class EstrategiaBusca(str, Enum):
    GLOBAL = "global"
    POR_COMPONENTE = "por_componente"

class DecompositionResult(BaseModel):
    """Resultado da decomposição em componentes"""
    solucao_principal: str = Field(description="Solução principal identificada")
    tags_semanticas: List[str] = Field(description="Lista de palavras-chave que descrevem a solução")
    tipo_de_solucao: str = Field(description="Tipo de solução: produto ou sistema")
    complexidade_estimada: str = Field(description="Nível de complexidade: simples, medio, complexo")
    requisitos_do_produto: List[RequisitosDoProduto] = Field(description="Lista de requisitos que o produto deve apresentar já embutidos")
    itens_a_comprar: List[ComponenteParaAquisicao] = Field(description="Lista de componentes que precisam ser adquiridos")
    alternativas_viaveis: List[AlternativaViavel] = Field(description="Alternativas possíveis")
    orcamento_estimado_range: Dict[str, int] = Field(description="Range de orçamento estimado")
    prazo_implementacao_dias: int = Field(description="Prazo estimado de implementação")
    preferencias_usuario: List[str] = Field(description="Preferências do usuário")
    estrategia_busca: EstrategiaBusca = Field(default=EstrategiaBusca.GLOBAL, description="Estratégia de busca para componentes")

class Inferir_estrategiaBusca(BaseModel):
    """
    Modelo para inferir a estratégia de busca baseada na complexidade da decomposição
    """
    estrategia_busca: EstrategiaBusca = Field(description="Estratégia de busca inferida")
