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
        2. **tipo_de_solucao**: 
        - Use "produto" para soluções em que, na aquisição, seja necessário apenas um único item ou pacote fechado, mesmo que incluam múltiplas partes internas.
        - Use "sistema" para soluções compostas por múltiplos elementos que precisam ser adquiridos separadamente, ou pedido de varios produtos.
        3. **complexidade_estimada**: Um dos seguintes valores: **"simples"**, **"medio"**, **"complexo"**.
        4. **itens_a_comprar**: Lista de itens que devem ser adquiridos separadamente para compor a solução (primeiro item sendo o principal), cada um com:
        - **nome**: pode ser geral como "Computador", "Impressora" ou específico como "Impressora HP LaserJet" dependendo da necessidade do cliente.
        - **natureza_componente**: "hardware", "software" ou "servico"
        - **prioridade**: "critica", "alta", "media" ou "baixa" (tudo especificado pelo usuário e partes imprescindíveis é "critica" ou "alta")
        - **categoria**: categoria do componente tendo apenas as seguintes opções:
            - Hardware de Servidores e Storage, Hardware de Posto de Trabalho, Serviços de Cloud, Networking
            - Cibersegurança, Videovigilância (CCTV), Controle de Acesso
            - Software de Produtividade e Colaboração, Business Intelligence (BI), Software de Conformidade (Compliance), Software de Gestão (ERP/CRM)
            - Automação de Postos de Combustível, Quiosques e Autoatendimento
            - Internet das Coisas (IoT), Realidade Virtual e Aumentada (VR/AR), Soluções para Saúde (Health Tech)
        - **especificacoes_minimas** : objeto com detalhes técnicos caso haja, dependendo da necessidade do cliente, ordenados pelo nível de exigência (ex: {"RAM": "8GB DDR4"} ou mais geral {RAM >= 8GB})
        - **justificativa** : texto explicando a importância desse requisito
        - **tags**: lista de tags relacionadas a este item (ou deixe vazia)
        - **alternativas**: lista de alternativas equivalentes (ou vazia)
        - **quantidade**: número inteiro indicando quantos itens são necessários
        - **orcamento_estimado**: valor inteiro (Kwanzas) indicando o orçamento unitario máximo para este item (se não especificado: 0)
        - **preferencias_usuario**: lista de preferências expressas pelo cliente de forma implícita ou explícita sobre o item (ex: ["preferência por soluções open-source", "manutenção local"])
        - **rigor**: quão estritamente o usuário especificou seu pedido (medida do nível de exigência, 0–5).
        5. **alternativas_viaveis**: Lista de outras soluções viáveis (nunca vazia) com:
        - **nome**, **tipo**, 
        - **vantagens**: lista de pontos positivos
        - **limitacoes**: lista de desvantagens ou restrições
        - **cenario_recomendado**: str onde essa alternativa seria preferível
        6. **prazo_implementacao_dias**: número inteiro com a estimativa de dias (se não especificado: 0)
       
        ---

        ATENÇÃO:
        - Respeite os nomes dos campos exatamente como estão.
        - Retorne somente um YAML válido conforme as instruções. Nenhum texto adicional.
        - Não invente informações só por estarem em falta
        - Se a descrição do item for genérica (ex.: "computador", "impressora"), registre apenas como está, sem acrescentar requisitos ou limitações.
        - Se a descrição do item indicar uma categoria específica (ex.: "computador de alto desempenho", "impressora multifuncional"), registre apenas os requisitos mínimos necessários que caracterizam essa categoria, sem extrapolar.
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
            
            print("\n" + "="*60)
            print("📋 YAML RETORNADO PELA LLM:")
            print("-" * 60)
            print(yaml_output_string)
            print("="*60)
            
            try:
                data_dict = yaml.safe_load(yaml_output_string)
                resposta_validada = DecompositionResult.model_validate(data_dict)
                
                print("\n✅ DECOMPOSIÇÃO CONCLUÍDA COM SUCESSO!")
                print(f"📌 Solução Principal: {resposta_validada.solucao_principal}")
                print(f"🔧 Tipo de Solução: {resposta_validada.tipo_de_solucao}")
                print(f"📦 Itens a Comprar: {len(resposta_validada.itens_a_comprar)} itens")
                print(f"🔄 Alternativas Viáveis: {len(resposta_validada.alternativas_viaveis)} alternativas")
                print("-" * 60 + "\n")
                
                return resposta_validada

            except yaml.YAMLError as e:
                print(f"\n❌ ERRO DE YAML: O conteúdo retornado pela LLM não é um YAML válido.")
                print(f"🔍 Detalhes do erro: {e}")
                print(f"📄 Conteúdo problemático:")
                print("-" * 40)
                print(yaml_output_string[:500] + "..." if len(yaml_output_string) > 500 else yaml_output_string)
                print("-" * 40)
                print("🔄 Gerando decomposição de fallback...")
                return create_fallback_decomposition(main_request)
            except Exception as e:
                print(f"\n❌ ERRO DE VALIDAÇÃO: Falha ao validar a estrutura dos dados.")
                print(f"🔍 Detalhes do erro: {e}")
                print(f"📄 Dados recebidos:")
                print("-" * 40)
                print(str(data_dict)[:500] + "..." if len(str(data_dict)) > 500 else str(data_dict))
                print("-" * 40)
                print("🔄 Gerando decomposição de fallback...")
                return create_fallback_decomposition(main_request)

        except Exception as e:
            print(f"\n❌ ERRO NA COMUNICAÇÃO COM GROQ:")
            print(f"🔍 Detalhes: {e}")
            print("🔄 Gerando decomposição de fallback...")
            return create_fallback_decomposition(main_request)

    def gerar_brief(self, main_request: str) -> Dict[str, Any]:
        """
        Decompõe a solicitação e retorna um dicionário "brief" compatível com gerar_estrutura_de_queries do nlp_parser.
        """
        print(f"\n🤖 INICIANDO DECOMPOSIÇÃO DA SOLICITAÇÃO:")
        print(f"📝 Texto original: {main_request[:100]}{'...' if len(main_request) > 100 else ''}")
        print("-" * 60)
        
        result = self.decompose_request(main_request)
        
        print("🔄 PROCESSANDO COMPONENTES DO BRIEF...")
        
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
                "quantidade": getattr(comp, "quantidade", 1) or 1,
                "orcamento_estimado": getattr(comp, "orcamento_estimado", 0) or 0,
                "preferencias_usuario": comp.preferencias_usuario or [],
                "rigor": getattr(comp, "rigor", 0) or 0,
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
            "itens_a_comprar": itens,
            "alternativas_viaveis": alternativas,
            "prazo_implementacao_dias": result.prazo_implementacao_dias,
        }
        
        print("✅ BRIEF GERADO COM SUCESSO!")
        print(f"📊 Resumo do Brief:")
        print(f"   - Itens a comprar: {len(itens)}")
        print(f"   - Alternativas viáveis: {len(alternativas)}")
        print("-" * 60 + "\n")
        
        return brief

    def test_connection(self) -> bool:
        """Testa se a conexão com a API do Groq está funcionando"""
        try:
            print("🔌 TESTANDO CONEXÃO COM GROQ API...")
            test_result = self.groq_client.chat.completions.create(
                model="gemma2-9b-it",
                response_model=DecompositionResult,
                messages=[
                    {"role": "user", "content": "Decomponha esta solicitação simples: preciso de um computador"}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            print("✅ CONEXÃO COM GROQ API ESTABELECIDA COM SUCESSO!")
            return True
        except Exception as e:
            print(f"❌ FALHA NA CONEXÃO COM GROQ API:")
            print(f"🔍 Detalhes do erro: {e}")
            return False

