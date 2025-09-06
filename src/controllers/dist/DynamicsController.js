"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var DynamicsIntegrationService_1 = require("../services/DynamicsIntegrationService");
var CotacoesService_1 = require("../services/CotacoesService");
var DynamicsController = /** @class */ (function () {
    function DynamicsController() {
        this.dynamicsService = new DynamicsIntegrationService_1["default"]();
    }
    /**
     * Testa a conexão com Dynamics 365
     */
    DynamicsController.prototype.testarConexao = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var sucesso, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.dynamicsService.testarConexao()];
                    case 1:
                        sucesso = _a.sent();
                        if (sucesso) {
                            return [2 /*return*/, res.status(200).json({
                                    message: 'Conexão com Dynamics 365 estabelecida com sucesso!',
                                    status: 'conectado'
                                })];
                        }
                        else {
                            return [2 /*return*/, res.status(503).json({
                                    message: 'Falha ao conectar com Dynamics 365',
                                    status: 'desconectado'
                                })];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro interno ao testar conexão',
                                error: error_1.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obtém informações do ambiente Dynamics
     */
    DynamicsController.prototype.obterInformacoesAmbiente = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var info, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.dynamicsService.obterInformacoesAmbiente()];
                    case 1:
                        info = _a.sent();
                        if (info) {
                            return [2 /*return*/, res.status(200).json({
                                    message: 'Informações do ambiente obtidas com sucesso',
                                    data: info
                                })];
                        }
                        else {
                            return [2 /*return*/, res.status(404).json({
                                    message: 'Não foi possível obter informações do ambiente'
                                })];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro ao obter informações do ambiente',
                                error: error_2.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obtém configurações atuais do Dynamics (sem dados sensíveis)
     */
    DynamicsController.prototype.obterConfiguracoes = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var config;
            return __generator(this, function (_a) {
                try {
                    config = this.dynamicsService.obterConfig();
                    return [2 /*return*/, res.status(200).json({
                            message: 'Configurações do Dynamics 365',
                            data: config
                        })];
                }
                catch (error) {
                    return [2 /*return*/, res.status(500).json({
                            message: 'Erro ao obter configurações',
                            error: error.message
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Atualiza configurações do Dynamics (método desabilitado temporariamente)
     */
    DynamicsController.prototype.atualizarConfiguracoes = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, res.status(501).json({
                            message: 'Método temporariamente desabilitado - configurações são carregadas do .env',
                            hint: 'Use as variáveis de ambiente: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, DYNAMICS_WEB_API_ENDPOINT'
                        })];
                }
                catch (error) {
                    return [2 /*return*/, res.status(500).json({
                            message: 'Erro ao atualizar configurações',
                            error: error.message
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
     */
    DynamicsController.prototype.consultarEntidadesDisponiveis = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var entidades, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('🔍 [DYNAMICS] Consultando entidades disponíveis...');
                        return [4 /*yield*/, this.dynamicsService.consultarEntidadesDisponiveis()];
                    case 1:
                        entidades = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: 'Entidades disponíveis consultadas com sucesso',
                                data: entidades,
                                instructions: {
                                    message: "Procure por entidades relacionadas a cotações/quotes",
                                    suggestion: "Use uma das entidades 'quotesRelated' ou 'salesRelated' no lugar de 'quotes'",
                                    commonNames: [
                                        "quotes (padrão)",
                                        "quotations",
                                        "opportunities (vendas)",
                                        "salesorders (pedidos)",
                                        "invoices (faturas)"
                                    ]
                                }
                            })];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro interno ao consultar entidades disponíveis',
                                error: error_3.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DynamicsController.prototype.consultarEntidadesPadrao = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var entidades, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('🔍 [DYNAMICS] Consultando entidades padrão para configuração...');
                        return [4 /*yield*/, this.dynamicsService.consultarEntidadesPadrao()];
                    case 1:
                        entidades = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: 'Entidades padrão consultadas com sucesso',
                                data: entidades,
                                instructions: {
                                    message: "Use os GUIDs abaixo no método transformCotacaoToDynamics",
                                    accounts: "Escolha um accountid para usar como customerid_account",
                                    currencies: "Escolha um transactioncurrencyid para usar como moeda",
                                    pricelevels: "Escolha um pricelevelid para usar como lista de preços"
                                }
                            })];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro interno ao consultar entidades padrão',
                                error: error_4.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Envia uma cotação específica para Dynamics (teste manual)
     */
    DynamicsController.prototype.enviarCotacao = function (req, res) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var id, cotacao, sucesso, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        id = req.params.id;
                        console.log("\uD83D\uDCCB [DYNAMICS CONTROLLER] Recebida solicita\u00E7\u00E3o para enviar cota\u00E7\u00E3o ID: " + id);
                        if (!id || isNaN(Number(id))) {
                            return [2 /*return*/, res.status(400).json({
                                    message: 'ID da cotação é obrigatório e deve ser um número'
                                })];
                        }
                        // Buscar cotação
                        console.log("\uD83D\uDD0D [DYNAMICS CONTROLLER] Buscando cota\u00E7\u00E3o ID: " + id);
                        return [4 /*yield*/, CotacoesService_1["default"].getById(Number(id))];
                    case 1:
                        cotacao = _b.sent();
                        if (!cotacao) {
                            return [2 /*return*/, res.status(404).json({
                                    message: "Cota\u00E7\u00E3o com ID " + id + " n\u00E3o encontrada"
                                })];
                        }
                        // Verificar se está aprovada
                        if (!cotacao.aprovacao) {
                            return [2 /*return*/, res.status(400).json({
                                    message: 'Apenas cotações aprovadas podem ser enviadas para o Dynamics',
                                    cotacao: {
                                        id: cotacao.id,
                                        aprovacao: cotacao.aprovacao,
                                        status: cotacao.status
                                    }
                                })];
                        }
                        return [4 /*yield*/, this.dynamicsService.processarCotacaoAprovada(cotacao)];
                    case 2:
                        sucesso = _b.sent();
                        if (sucesso) {
                            return [2 /*return*/, res.status(200).json({
                                    message: "Cota\u00E7\u00E3o " + id + " enviada para Dynamics com sucesso!",
                                    cotacao: {
                                        id: cotacao.id,
                                        produto: (_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome,
                                        orcamento_geral: cotacao.orcamento_geral,
                                        aprovacao: cotacao.aprovacao
                                    }
                                })];
                        }
                        else {
                            return [2 /*return*/, res.status(502).json({
                                    message: "Falha ao enviar cota\u00E7\u00E3o " + id + " para Dynamics",
                                    cotacao: {
                                        id: cotacao.id,
                                        aprovacao: cotacao.aprovacao
                                    }
                                })];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _b.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro interno ao enviar cotação',
                                error: error_5.message
                            })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reenvia todas as cotações aprovadas para Dynamics (sincronização em lote)
     */
    DynamicsController.prototype.sincronizarCotacoesAprovadas = function (req, res) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var todasCotacoes, cotacoesAprovadas, enviadas, falharam, resultados, _i, cotacoesAprovadas_1, cotacao, sucesso, error_6, error_7;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 8, , 9]);
                        console.log('🔄 [DYNAMICS] Iniciando sincronização em lote...');
                        return [4 /*yield*/, CotacoesService_1["default"].getAll()];
                    case 1:
                        todasCotacoes = _d.sent();
                        cotacoesAprovadas = todasCotacoes.filter(function (cotacao) { return cotacao.aprovacao === true; });
                        if (cotacoesAprovadas.length === 0) {
                            return [2 /*return*/, res.status(200).json({
                                    message: 'Nenhuma cotação aprovada encontrada para sincronização',
                                    total: 0,
                                    enviadas: 0,
                                    falharam: 0
                                })];
                        }
                        enviadas = 0;
                        falharam = 0;
                        resultados = [];
                        _i = 0, cotacoesAprovadas_1 = cotacoesAprovadas;
                        _d.label = 2;
                    case 2:
                        if (!(_i < cotacoesAprovadas_1.length)) return [3 /*break*/, 7];
                        cotacao = cotacoesAprovadas_1[_i];
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.dynamicsService.processarCotacaoAprovada(cotacao)];
                    case 4:
                        sucesso = _d.sent();
                        if (sucesso) {
                            enviadas++;
                            resultados.push({
                                id: cotacao.id,
                                status: 'enviada',
                                produto: (_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome
                            });
                        }
                        else {
                            falharam++;
                            resultados.push({
                                id: cotacao.id,
                                status: 'falhou',
                                produto: (_b = cotacao.produto) === null || _b === void 0 ? void 0 : _b.nome
                            });
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _d.sent();
                        falharam++;
                        resultados.push({
                            id: cotacao.id,
                            status: 'erro',
                            produto: (_c = cotacao.produto) === null || _c === void 0 ? void 0 : _c.nome,
                            erro: error_6 instanceof Error ? error_6.message : 'Erro desconhecido'
                        });
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, res.status(200).json({
                            message: "Sincroniza\u00E7\u00E3o conclu\u00EDda",
                            total: cotacoesAprovadas.length,
                            enviadas: enviadas,
                            falharam: falharam,
                            resultados: resultados
                        })];
                    case 8:
                        error_7 = _d.sent();
                        return [2 /*return*/, res.status(500).json({
                                message: 'Erro interno na sincronização',
                                error: error_7.message
                            })];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lista todas as entidades disponíveis no Dynamics
     */
    DynamicsController.prototype.listarTodasEntidades = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var entidades, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('🔍 [DYNAMICS CONTROLLER] Listando todas as entidades...');
                        return [4 /*yield*/, this.dynamicsService.listarEntidadesDisponiveis()];
                    case 1:
                        entidades = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                success: true,
                                message: 'Entidades listadas com sucesso',
                                data: {
                                    total: entidades.length,
                                    entidades: entidades.slice(0, 100) // Primeiras 100 para não sobrecarregar
                                }
                            })];
                    case 2:
                        error_8 = _a.sent();
                        console.error('❌ [DYNAMICS CONTROLLER] Erro ao listar entidades:', error_8);
                        return [2 /*return*/, res.status(500).json({
                                success: false,
                                message: 'Erro interno do servidor',
                                error: error_8.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lista todas as oportunidades (opportunities) do Dynamics 365
     */
    DynamicsController.prototype.listarOportunidades = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var oportunidades, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('🔍 [DYNAMICS CONTROLLER] Buscando oportunidades...');
                        return [4 /*yield*/, this.dynamicsService.listarOportunidades()];
                    case 1:
                        oportunidades = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                success: true,
                                message: 'Oportunidades listadas com sucesso',
                                total: oportunidades.length,
                                data: oportunidades
                            })];
                    case 2:
                        error_9 = _a.sent();
                        console.error('❌ [DYNAMICS CONTROLLER] Erro ao listar oportunidades:', error_9);
                        return [2 /*return*/, res.status(500).json({
                                success: false,
                                message: 'Erro ao buscar oportunidades',
                                error: error_9.message
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return DynamicsController;
}());
exports["default"] = new DynamicsController();
