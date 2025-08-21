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
    orcamento_estimado: int = Field(default=0, description="Orçamento estimado para este componente")
    preferencias_usuario: List[str] = Field(default=[], description="Preferências do usuário")
    rigor: int = Field(default=0, description="Rigor da solicitação (0-5)")

class AlternativaViavel(BaseModel):
    nome: str = Field(description="Nome da alternativa")
    tipo: str = Field(description="Tipo de alternativa")
    vantagens: List[str] = Field(description="Vantagens desta alternativa")
    limitacoes: List[str] = Field(description="Limitações ou desvantagens")
    cenario_recomendado: str = Field(description="Quando usar esta alternativa")


class DecompositionResult(BaseModel):
    """Resultado da decomposição em componentes"""
    solucao_principal: str = Field(description="Solução principal identificada")
    tipo_de_solucao: str = Field(description="Tipo de solução: produto ou sistema")
    complexidade_estimada: str = Field(description="Nível de complexidade: simples, medio, complexo")
    itens_a_comprar: List[ComponenteParaAquisicao] = Field(description="Lista de componentes que precisam ser adquiridos")
    alternativas_viaveis: List[AlternativaViavel] = Field(description="Alternativas possíveis")
    prazo_implementacao_dias: int = Field(default=0, description="Prazo estimado de implementação")