import json
import yaml
import instructor
from groq import Groq
from typing import Dict, Any
from enum import Enum

from .models import DecompositionResult
from .utils import validate_and_fix_result, create_fallback_decomposition

class SolutionDecomposer:
    def __init__(self, groq_api_key: str):
        """Inicializa o decomposer com a API do Groq"""
        self.groq_client = instructor.from_groq(
            Groq(api_key=groq_api_key)
        )
        self.groq_simple = Groq(api_key=groq_api_key)

    def decompose_request(self, main_request: str) -> DecompositionResult:
        """
        Decompõe uma solicitação complexa em componentes menores
        
        Args:
            main_request (str): Solicitação principal do cliente
            
        Returns:
            DecompositionResult: Resultado estruturado da decomposição
        """
        
        decomposition_prompt = """
        Você é um especialista em soluções tecnológicas. Sua tarefa é decompor uma solicitação de cliente empresarial em um YAML altamente estruturado. 

        Seu objetivo é retornar EXCLUSIVAMENTE um YAML válido e completo, compatível com o schema abaixo. Não adicione comentários nem formatação Markdown.

        ---

        CONTEXTO DA EMPRESA:
        Oferecemos soluções em: IT Hardware, Automação de Postos, Software, Cloud, Cibersegurança, Realidade Virtual (VR), Internet das Coisas (IoT), Hospitais Inteligentes, Quiosques Self-Service, Business Intelligence (BI), KYC-AML, CCTV, Controle de Acesso.

        ---

        PREENCHA OS CAMPOS ABAIXO EXATAMENTE COMO ESPECIFICADO:

        1. **solucao_principal**: Descrição clara e objetiva da solução proposta.
        2. **tags_semanticas**: Lista de sinônimos e termos relacionados que descrevem a solucao_principal.
        3. **tipo_de_solucao**: 
        - Use "produto" para soluções em que, na aquisição, seja necessário apenas um único item ou pacote fechado, mesmo que incluam múltiplas partes internas.
        - Use "sistema" para soluções compostas por múltiplos elementos que precisam ser adquiridos separadamente, ou pedido de varios produtos.
        4. **complexidade_estimada**: Um dos seguintes valores: **"simples"**, **"medio"**, **"complexo"**.
        5. **requisitos_do_produto**: Lista de componentes ou funcionalidades embutidas que o produto final deve conter, cada um com:
        - **nome**: ex: "Memória RAM", "Software de Gestão"
        - **natureza_componente **: "hardware", "software" ou "servico"
        - **nivel_de_exigencia**: "critica", "alta", "media" ou "baixa"
        - **especificacoes_minimas**: objeto com detalhes técnicos ordenados pelo nível de exigência (ex: {"tamanho": "8GB", "tipo": "DDR4"})
        - **justificativa**: texto explicando a importância desse requisito
        - **restricoes_tecnicas**: lista de limitações técnicas aceitáveis (ou deixe vazia)
        - **variacoes_aceitaveis**: lista de variações toleradas (ou deixe vazia)
        5. **itens_a_comprar**: Lista de itens que devem ser adquiridos separadamente para compor a solução (primeiro item sendo o principal), cada um com:
        - **nome**, **natureza_componente**
        - **prioridade**: "critica", "alta", "media" ou "baixa" (tudo especificado pelo usuário e partes imprescindíveis é "critica" ou "alta")
        - **categoria**: categoria do componente tendo apenas as seguintes opções:
            - Hardware de Servidores e Storage, Hardware de Posto de Trabalho, Serviços de Cloud, Networking
            - Cibersegurança, Videovigilância (CCTV), Controle de Acesso
            - Software de Produtividade e Colaboração, Business Intelligence (BI), Software de Conformidade (Compliance), Software de Gestão (ERP/CRM)
            - Automação de Postos de Combustível, Quiosques e Autoatendimento
            - Internet das Coisas (IoT), Realidade Virtual e Aumentada (VR/AR), Soluções para Saúde (Health Tech)
        - **especificacoes_minimas**, **justificativa**.
        - **tags**: lista de tags relacionadas a este item (ou deixe vazia)
        - **alternativas**: lista de alternativas equivalentes (ou vazia)
        - **quantidade**: número inteiro indicando quantos itens são necessários
        6. **alternativas_viaveis**: Lista de outras soluções viáveis (nunca vazia) com:
        - **nome**, **tipo**, 
        - **vantagens**: lista de pontos positivos
        - **limitacoes**: lista de desvantagens ou restrições
        - **cenario_recomendado**: str onde essa alternativa seria preferível
        - **economia_estimada**: valor aproximado de economia (número decimal)
        7. **orcamento_estimado_range**: objeto com os campos:
        - **minimo**: valor inteiro (Kwanzas)
        - **maximo**: valor inteiro (Kwanzas)
        8. **prazo_implementacao_dias**: número inteiro com a estimativa de dias
        9. **preferencias_usuario**: lista de preferências expressas pelo cliente (ex: ["preferência por soluções open-source", "manutenção local"])

        ---

        ATENÇÃO:
        - Respeite os nomes dos campos exatamente como estão.
        - Retorne somente um YAML válido conforme as instruções. Nenhum texto adicional.
        - sem chaves {} no final

        """

        try:
            result = self.groq_simple.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": decomposition_prompt},
                    {"role": "user", "content": main_request}
                ],
                temperature=0.1,
                max_tokens=8000,
                stream=False
            )
            yaml_output_string = result.choices[0].message.content
            
            if yaml_output_string.endswith('}'):
                yaml_output_string = yaml_output_string[:-1].strip()
            
            print(yaml_output_string)
            try:
                data_dict = yaml.safe_load(yaml_output_string)
                resposta_validada = DecompositionResult.model_validate(data_dict)
                print("YAML recebido e validado com sucesso!")
                print(f"Solução: {resposta_validada.solucao_principal}")
                return resposta_validada

            except yaml.YAMLError as e:
                print(f"Erro: O YAML retornado pela LLM é inválido. Detalhes: {e}")
                print(f"YAML recebido: {yaml_output_string}")
                return create_fallback_decomposition(main_request)
            except Exception as e:
                print(f"Erro de validação: {e}")
                print(f"Dados recebidos: {yaml_output_string}")
                return create_fallback_decomposition(main_request)

        except Exception as e:
            print(f"Erro na decomposição com Groq: {e}")
            return create_fallback_decomposition(main_request)

    def gerar_brief(self, main_request: str) -> Dict[str, Any]:
        """
        Decompõe a solicitação e retorna um dicionário "brief" compatível com gerar_estrutura_de_queries do nlp_parser.
        """
        result = self.decompose_request(main_request)
        
        # Mapear itens a comprar
        itens = []
        for comp in result.itens_a_comprar:
            itens.append({
                "nome": comp.nome,
                "natureza_componente": comp.natureza_componente,
                "prioridade": comp.prioridade.value if isinstance(comp.prioridade, Enum) else str(comp.prioridade),
                "categoria": comp.categoria,
                "especificacoes_minimas": comp.especificacoes_minimas,
                "justificativa": comp.justificativa,
                "tags": comp.tags or [],
                "quantidade": getattr(comp, "quantidade", 1) or 1
            })
        
        # Mapear requisitos do produto
        requisitos = []
        for req in result.requisitos_do_produto:
            requisitos.append({
                "nome": req.nome,
                "natureza_componente": req.natureza_componente,
                "nivel_de_exigencia": req.nivel_de_exigencia.value if isinstance(req.nivel_de_exigencia, Enum) else str(req.nivel_de_exigencia),
                "especificacoes_minimas": req.especificacoes_minimas,
                "justificativa": req.justificativa,
                "restricoes_tecnicas": req.restricoes_tecnicas or [],
                "variacoes_aceitaveis": req.variacoes_aceitaveis or []
            })
        
        # Mapear alternativas viáveis
        alternativas = []
        for alt in result.alternativas_viaveis:
            alternativas.append({
                "nome": alt.nome,
                "tipo": alt.tipo,
                "vantagens": alt.vantagens,
                "limitacoes": alt.limitacoes,
                "cenario_recomendado": alt.cenario_recomendado
            })
        
        brief = {
            "solucao_principal": result.solucao_principal,
            "tipo_de_solucao": result.tipo_de_solucao,
            "tags_semanticas": result.tags_semanticas,
            "itens_a_comprar": itens,
            "requisitos_do_produto": requisitos,
            "alternativas_viaveis": alternativas,
            "preferencias_usuario": result.preferencias_usuario,
            "orcamento_estimado_range": result.orcamento_estimado_range,
            "prazo_implementacao_dias": result.prazo_implementacao_dias,
        }
        return brief

    def test_connection(self) -> bool:
        """Testa se a conexão com a API do Groq está funcionando"""
        try:
            test_result = self.groq_client.chat.completions.create(
                model="gemma2-9b-it",
                response_model=DecompositionResult,
                messages=[
                    {"role": "user", "content": "Decomponha esta solicitação simples: preciso de um computador"}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            return True
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False
    def test_connection(self) -> bool:
        """Testa se a conexão com a API do Groq está funcionando"""
        try:
            test_result = self.groq_client.chat.completions.create(
                model="gemma2-9b-it",
                response_model=DecompositionResult,
                messages=[
                    {"role": "user", "content": "Decomponha esta solicitação simples: preciso de um computador"}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            return True
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False

