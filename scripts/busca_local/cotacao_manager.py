from typing import Dict, Any, List, Optional
from busca_local.config import API_BASE_URL
import requests

class CotacaoManager:
    def __init__(self, supabase_manager):
        self.supabase = supabase_manager
        
    def _is_available(self) -> bool:
        """Verifica se o cliente Supabase está disponível."""
        return self.supabase.is_available()


    def insert_relatorio(self, cotacao_id: int, analise_local: List[Dict[str, Any]], criado_por: int = None):
        """
        Insere um relatório na tabela 'relatorios' e retorna o id criado, se já existir adiciona apenas o payload no array.
        """
        if not self._is_available():
            print("⚠️ Supabase indisponível: não foi possível criar relatório.")
            return None

        try:
            # Verifica se já existe relatorio para a cotação
            resp = self.supabase.supabase.table("relatorios").select("id, analise_local").eq("cotacao_id", cotacao_id).order("id", desc=True).limit(1).execute()
            data = getattr(resp, "data", None) or []
            if data:
                relatorio = data[0]
                relatorio_id = relatorio["id"]
                # Adiciona o novo payload ao array analise_local
                analise_atual = relatorio.get("analise_local") or []
                novo_analise = analise_atual + analise_local
                self.supabase.supabase.table("relatorios").update({"analise_local": novo_analise, "atualizado_em": "now()"}).eq("id", relatorio_id).execute()
                print(f"📝 Relatório atualizado: id={relatorio_id}")
                return relatorio_id
            else:
                # Cria novo relatorio
                body = {
                    "cotacao_id": cotacao_id,
                    "analise_local": analise_local,
                    "criado_por": criado_por,
                    "versao": 1,
                    "status": "rascunho"
                }
                resp = self.supabase.supabase.table("relatorios").insert(body).execute()
                data = getattr(resp, "data", None) or []
                if data and "id" in data[0]:
                    relatorio_id = data[0]["id"]
                    print(f"📝 Relatório criado: id={relatorio_id}")
                    return relatorio_id
                print(f"⚠️ Falha ao obter id do relatório criado. Resposta: {resp}")
        except Exception as e:
            print(f"❌ Erro ao criar/atualizar relatório: {e}")
        return None


        
    def insert_prompt(
        self,
        texto_original: str,
        dados_extraidos: Dict[str, Any],
        cliente: Dict[str, Any],
        *,
        origem: Optional[Dict[str, Any]] = None,
        status: Optional[str] = "analizado",
        dados_bruto: Dict[str, Any]
    ) -> Optional[int]:
        """
        Cria um registro em 'prompts' via API REST e retorna o id.
        """
        body: Dict[str, Any] = {
            "texto_original": texto_original or "",
            "dados_extraidos": dados_extraidos or {},
            "cliente": cliente or {},
            "origem": origem or {"tipo": "interativo", "fonte": "nlp_parser"},
            "dados_bruto": dados_bruto or {}
        }
        if status:
            body["status"] = status
        if dados_bruto:
            body["dados_bruto"] = dados_bruto

        # URL da API (ajuste conforme necessário)
        api_url = f"{API_BASE_URL}/api/prompts"

        try:
            response = requests.post(api_url, json=body)
            if response.status_code == 201:
                resp_json = response.json()
                # Tenta extrair o id do campo 'data', senão pega diretamente do objeto
                prompt_id = None
                if "data" in resp_json:
                    prompt_data = resp_json["data"]
                    if isinstance(prompt_data, dict):
                        prompt_id = prompt_data.get("id")
                    elif isinstance(prompt_data, list) and prompt_data:
                        prompt_id = prompt_data[0].get("id")
                elif "id" in resp_json:
                    prompt_id = resp_json["id"]
                if prompt_id is not None:
                    print(f"📝 Prompt criado via API: id={prompt_id}")
                    return prompt_id
                print(f"⚠️ Prompt criado mas id não encontrado. Resposta: {resp_json}")
            else:
                print(f"❌ Erro ao criar prompt via API: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Erro ao chamar API de prompt: {e}")
        return None

    def insert_cotacao(
        self,
        prompt_id: int,
        *,
        status: Optional[str] = None,
        observacoes: Optional[str] = None,
        condicoes: Optional[Dict[str, Any]] = None,
        faltantes: Optional[List[Dict[str, Any]]] = None,
        aprovacao: Optional[bool] = None,
        motivo: Optional[str] = None,
        aprovado_por: Optional[int] = None,
        prazo_validade: Optional[str] = None
    ) -> Optional[int]:
        """
        Cria uma cotação mínima via API REST. Não exige produto_id e suporta salvar ids de queries faltantes.
        """
        
        payload: Dict[str, Any] = {"prompt_id": prompt_id}
        if status is None:
            status = "incompleta" if (faltantes and len(faltantes) > 0) else "completa"
        payload["status"] = status
        payload["aprovacao"] = bool(aprovacao) if aprovacao is not None else False
        if observacoes:
            payload["observacoes"] = observacoes
        if condicoes is not None:
            payload["condicoes"] = condicoes
        if faltantes is not None:
            payload["faltantes"] = faltantes
        if motivo is not None:
            payload["motivo"] = motivo
        if aprovado_por is not None:
            payload["aprovado_por"] = aprovado_por
        if prazo_validade is not None:
            payload["prazo_validade"] = prazo_validade
        payload.setdefault("orcamento_geral", 0)

        # URL da API (ajuste conforme necessário)
        api_url = f"{API_BASE_URL}/api/cotacoes"

        try:
            response = requests.post(api_url, json=payload)
            if response.status_code == 201:
                resp_json = response.json()
                cotacao_data = resp_json.get("data")
                cotacao_id = None
                if isinstance(cotacao_data, dict):
                    cotacao_id = cotacao_data.get("id")
                elif isinstance(cotacao_data, list) and cotacao_data:
                    cotacao_id = cotacao_data[0].get("id")
                if cotacao_id is not None:
                    print(f"🧾 Cotação criada via API: id={cotacao_id}")
                    return cotacao_id
                print(f"⚠️ Cotação criada mas id não encontrado. Resposta: {resp_json}")
            else:
                print(f"❌ Erro ao criar cotação via API: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Erro ao chamar API de cotação: {e}")
        return None

    def _build_item_snapshot_from_result(self, resultado: Dict[str, Any]) -> Dict[str, Any]:
        """Monta um snapshot mínimo do item a partir de um resultado de busca."""
        if not isinstance(resultado, dict):
            return {
                "item_nome": "Item",
                "item_descricao": None,
                "item_tags": [],
                "item_preco": None,
                "item_moeda": "AOA",
            }

        nome = str(resultado.get("nome") or resultado.get("item_nome") or "").strip()
        
        # Usar campo original do schema2: descricao
        descricao = str(resultado.get("descricao") or resultado.get("item_descricao") or "").strip()

        tags_raw = resultado.get("tags") or resultado.get("item_tags") or []
        if isinstance(tags_raw, list):
            item_tags = [str(t).strip() for t in tags_raw if str(t).strip()]
        elif isinstance(tags_raw, str):
            item_tags = [s.strip() for s in tags_raw.split(",") if s.strip()]
        else:
            item_tags = []

        preco_raw = resultado.get("preco")
        if preco_raw is None:
            preco_raw = resultado.get("item_preco")
        try:
            item_preco = float(preco_raw) if preco_raw is not None and str(preco_raw).strip() != "" else None
        except Exception:
            item_preco = None

        return {
            "item_nome": nome or str(resultado.get("categoria") or resultado.get("modelo") or "Item").strip() or "Item",
            "item_descricao": descricao or None,
            "item_tags": item_tags,
            "item_preco": item_preco,
            "item_moeda": "AOA",
        }

    def check_cotacao_item_exists(self, cotacao_id: int, produto_id: int) -> bool:
        """Verifica se já existe um item na cotação com o mesmo produto_id."""
        if not self._is_available():
            return False
        
        try:
            resp = self.supabase.supabase.table("cotacoes_itens").select("id").eq("cotacao_id", cotacao_id).eq("produto_id", produto_id).limit(1).execute()
            data = getattr(resp, "data", None) or []
            return len(data) > 0
        except Exception as e:
            print(f"⚠️ Erro ao verificar existência do item: {e}")
            return False

    def insert_cotacao_item(
        self,
        cotacao_id: int,
        *,
        origem: str,
        produto_id: Optional[int] = None,
        provider: Optional[str] = None,
        external_url: Optional[str] = None,
        item_nome: Optional[str] = None,
        item_descricao: Optional[str] = None,
        item_tags: Optional[List[str]] = None,
        item_preco: Optional[float] = None,
        item_moeda: Optional[str] = "AOA",
        condicoes: Optional[Dict[str, Any]] = None,
        payload: Optional[Dict[str, Any]] = None,
        quantidade: Optional[int] = 1,
    ) -> Optional[int]:
        """Adiciona um item à cotação."""
        if not self._is_available():
            print("⚠️ Supabase indisponível: não foi possível criar item da cotação.")
            return None

        origem_norm = str(origem or "").lower()
        if origem_norm not in {"local", "api", "web"}:
            print("⚠️ Origem inválida. Use 'local', 'api' ou 'web'.")
            return None

        # Verificar duplicata para produtos locais
        if produto_id is not None and self.check_cotacao_item_exists(cotacao_id, produto_id):
            print(f"⚠️ Produto ID {produto_id} já existe na cotação {cotacao_id}. Pulando inserção.")
            return None

        body: Dict[str, Any] = {
            "cotacao_id": cotacao_id,
            "origem": origem_norm,
        }

        if produto_id is not None:
            body["produto_id"] = produto_id

        # Snapshot obrigatório quando externo
        if produto_id is None:
            if not item_nome:
                print("⚠️ item_nome é obrigatório para itens externos.")
                return None
            body.update({
                "provider": provider,
                "external_url": external_url,
                "item_nome": item_nome,
                "item_descricao": item_descricao,
                "item_tags": item_tags or [],
                "item_preco": item_preco,
                "item_moeda": item_moeda or "AOA",
            })
        else:
            # Para locais, snapshot é opcional mas recomendado
            if item_nome:
                body.update({
                    "item_nome": item_nome,
                    "item_descricao": item_descricao,
                    "item_tags": item_tags or [],
                    "item_preco": item_preco,
                    "item_moeda": item_moeda or "AOA",
                })

        if condicoes is not None:
            body["condicoes"] = condicoes
        if payload is not None:
            body["payload"] = payload
        # incluir quantidade (local ou externo)
        if quantidade is None or quantidade <= 0:
            quantidade = 1
        body["quantidade"] = int(quantidade)

        try:
            resp = self.supabase.supabase.table("cotacoes_itens").insert(body).execute()
            data = getattr(resp, "data", None) or []
            if isinstance(data, list) and data and isinstance(data[0], dict) and "id" in data[0]:
                item_id = data[0]["id"]
                print(f"🧾 Item de cotação criado: id={item_id}")
                # Recalcular orçamento geral da cotação
                self.recalcular_orcamento_geral(cotacao_id)
                return item_id

            # Fallback: tentar localizar pelo par (cotacao_id, item_nome) mais recente
            try:
                sel = self.supabase.supabase.table("cotacoes_itens").select("id").eq("cotacao_id", cotacao_id)
                if item_nome:
                    sel = sel.eq("item_nome", item_nome)
                q = sel.order("id", desc=True).limit(1).execute()
                qd = getattr(q, "data", None) or []
                if qd:
                    item_id = qd[0].get("id")
                    if item_id is not None:
                        print(f"🧾 Item de cotação criado (fallback): id={item_id}")
                        self.recalcular_orcamento_geral(cotacao_id)
                        return item_id
            except Exception as ie:
                print(f"⚠️ Fallback de busca de item falhou: {ie}")

            print(f"⚠️ Falha ao obter id do item criado. Resposta: {resp}")
        except Exception as e:
            print(f"❌ Erro ao criar item da cotação: {e}")
        return None

    def insert_cotacao_item_from_result(
        self,
        cotacao_id: int,
        resultado_produto: Dict[str, Any],
        *,
        origem: str = "local",
        produto_id: Optional[int] = None,
        provider: Optional[str] = None,
        external_url: Optional[str] = None,
        condicoes: Optional[Dict[str, Any]] = None,
        payload: Optional[Dict[str, Any]] = None,
        quantidade: Optional[int] = 1,
    ) -> Optional[int]:
        """Constrói snapshot a partir de um resultado de busca e insere como item da cotação."""
        snap = self._build_item_snapshot_from_result(resultado_produto)
        return self.insert_cotacao_item(
            cotacao_id,
            origem=origem,
            produto_id=produto_id,
            provider=provider,
            external_url=external_url,
            item_nome=snap.get("item_nome"),
            item_descricao=snap.get("item_descricao"),
            item_tags=snap.get("item_tags"),
            item_preco=snap.get("item_preco"),
            item_moeda=snap.get("item_moeda"),
            condicoes=condicoes,
            payload=payload,
            quantidade=quantidade,
        )

    def recalcular_orcamento_geral(self, cotacao_id: int) -> Optional[float]:
        """
        Recalcula o orçamento geral da cotação somando item_preco * quantidade dos itens.
        """
        if not self._is_available():
            return None
        try:
            resp = self.supabase.supabase.table("cotacoes_itens").select("item_preco, quantidade").eq("cotacao_id", cotacao_id).execute()
            itens = getattr(resp, "data", None) or []
            total = 0.0
            for it in itens:
                preco = it.get("item_preco") or 0
                qtd = it.get("quantidade") or 1
                try:
                    total += float(preco) * int(qtd)
                except Exception:
                    pass
            self.supabase.supabase.table("cotacoes").update({"orcamento_geral": total}).eq("id", cotacao_id).execute()
            return total
        except Exception as e:
            print(f"⚠️ Erro ao recalcular orçamento da cotação {cotacao_id}: {e}")
            return None
