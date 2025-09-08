"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var DynamicsIntegrationService = /** @class */ (function () {
    function DynamicsIntegrationService() {
        /**
         * Processa uma cotação aprovada e tenta enviá-la para o Dynamics
         */
        this.cotacoesProcessadas = new Set();
        this.config = {
            webApiEndpoint: process.env.DYNAMICS_WEB_API_ENDPOINT || '',
            azureTenantId: process.env.AZURE_TENANT_ID || '',
            azureClientId: process.env.AZURE_CLIENT_ID || '',
            azureClientSecret: process.env.AZURE_CLIENT_SECRET || ''
        };
        this.validateConfig();
    }
    /**
     * Valida se todas as configurações necessárias estão presentes
     */
    DynamicsIntegrationService.prototype.validateConfig = function () {
        var _this = this;
        var requiredFields = [
            'webApiEndpoint',
            'azureTenantId',
            'azureClientId',
            'azureClientSecret'
        ];
        var missingFields = requiredFields.filter(function (field) { return !_this.config[field]; });
        if (missingFields.length > 0) {
            console.warn("\u26A0\uFE0F [DYNAMICS] Configura\u00E7\u00F5es essenciais faltando: " + missingFields.join(', '));
        }
    };
    /**
     * Obtém token OAuth do Azure AD para autenticação no Dynamics
     */
    DynamicsIntegrationService.prototype.getOAuthToken = function () {
        return __awaiter(this, void 0, Promise, function () {
            var tokenUrl, baseUrl, body, response, errorText, tokenData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        tokenUrl = "https://login.microsoftonline.com/" + this.config.azureTenantId + "/oauth2/v2.0/token";
                        baseUrl = this.config.webApiEndpoint.replace('/api/data/v9.2', '');
                        body = new URLSearchParams({
                            grant_type: 'client_credentials',
                            client_id: this.config.azureClientId,
                            client_secret: this.config.azureClientSecret,
                            scope: baseUrl + "/.default"
                        });
                        console.log("\uD83D\uDD11 [DYNAMICS] Obtendo token OAuth para scope: " + baseUrl + "/.default");
                        return [4 /*yield*/, fetch(tokenUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                body: body.toString()
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        throw new Error("OAuth falhou (" + response.status + "): " + errorText);
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        tokenData = _a.sent();
                        console.log("\u2705 [DYNAMICS] Token OAuth obtido com sucesso");
                        return [2 /*return*/, tokenData.access_token];
                    case 5:
                        error_1 = _a.sent();
                        console.error("\u274C [DYNAMICS] Erro ao obter token OAuth:", error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Testa a conexão com Dynamics 365
     */
    DynamicsIntegrationService.prototype.testarConexao = function () {
        return __awaiter(this, void 0, Promise, function () {
            var testUrl, token, headers, response, errorText, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Testando conex\u00E3o com Dynamics...");
                        console.log("\uD83D\uDD0D [DYNAMICS] Config atual: {\n  webApiEndpoint: '" + this.config.webApiEndpoint + "',\n  azureTenantId: '" + this.config.azureTenantId.substring(0, 8) + "...',\n  azureClientId: '" + this.config.azureClientId.substring(0, 8) + "...',\n  hasAzureConfig: " + !!(this.config.azureClientSecret) + "\n}");
                        testUrl = this.config.webApiEndpoint + "/$metadata";
                        console.log("\uD83D\uDD0D [DYNAMICS] Testando URL: " + testUrl);
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _a.sent();
                        console.log("\uD83D\uDD0D [DYNAMICS] Token OAuth obtido para teste");
                        headers = {
                            'Accept': 'application/xml',
                            'Authorization': "Bearer " + token
                        };
                        console.log("\uD83D\uDD0D [DYNAMICS] Headers:", {
                            'Accept': 'application/xml',
                            'Authorization': "Bearer [HIDDEN]"
                        });
                        return [4 /*yield*/, fetch(testUrl, {
                                method: 'GET',
                                headers: headers
                            })];
                    case 2:
                        response = _a.sent();
                        console.log("\uD83D\uDD0D [DYNAMICS] Response status: " + response.status);
                        if (!response.ok) return [3 /*break*/, 3];
                        console.log("\u2705 [DYNAMICS] Conex\u00E3o estabelecida com sucesso!");
                        return [2 /*return*/, true];
                    case 3: return [4 /*yield*/, response.text()];
                    case 4:
                        errorText = _a.sent();
                        console.error("\u274C [DYNAMICS] Falha na conex\u00E3o: " + response.status + " - " + errorText);
                        return [2 /*return*/, false];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.error("\u274C [DYNAMICS] Erro ao testar conex\u00E3o:", error_2);
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Envia dados para o Dynamics 365
     */
    DynamicsIntegrationService.prototype.enviarParaDynamics = function (entity, entityName) {
        return __awaiter(this, void 0, Promise, function () {
            var url, token, headers, response, errorText, result_1, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        url = this.config.webApiEndpoint + "/" + entityName;
                        console.log("\uD83D\uDD04 [DYNAMICS] Preparando envio para: " + url);
                        console.log("\uD83D\uDCCA [DYNAMICS] Entity name: " + entityName);
                        // Obter token OAuth
                        console.log("\uD83D\uDD11 [DYNAMICS] Obtendo token OAuth...");
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _a.sent();
                        console.log("\u2705 [DYNAMICS] Token obtido com sucesso");
                        headers = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0',
                            'Authorization': "Bearer " + token
                        };
                        console.log("\uD83D\uDD04 [DYNAMICS] Enviando dados para: " + url);
                        console.log("\uD83D\uDCCA [DYNAMICS] Payload:", JSON.stringify(entity, null, 2));
                        console.log("\uD83D\uDCCB [DYNAMICS] Headers:", {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0',
                            'Authorization': 'Bearer [HIDDEN]'
                        });
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: headers,
                                body: JSON.stringify(entity)
                            })];
                    case 2:
                        response = _a.sent();
                        console.log("\uD83D\uDCE1 [DYNAMICS] Response status: " + response.status + " " + response.statusText);
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _a.sent();
                        console.error("\u274C [DYNAMICS] Erro HTTP " + response.status + ": " + errorText);
                        // Se for 404, tentar próxima entidade
                        if (response.status === 404 && !entityName) {
                            console.log("\uD83D\uDD04 [DYNAMICS] Tentando pr\u00F3xima entidade...");
                            return [2 /*return*/, false]; // Falha, mas pode tentar outra entidade
                        }
                        throw new Error("HTTP " + response.status + ": " + errorText);
                    case 4:
                        if (!(response.status === 201 || response.status === 204)) return [3 /*break*/, 7];
                        console.log("\u2705 [DYNAMICS] Dados enviados com sucesso! Status: " + response.status);
                        if (!(response.status === 204)) return [3 /*break*/, 5];
                        console.log("\uD83D\uDCCB [DYNAMICS] Entidade criada sem retorno de dados (204 No Content)");
                        return [2 /*return*/, true];
                    case 5: return [4 /*yield*/, response.json()];
                    case 6:
                        result_1 = _a.sent();
                        console.log("\uD83D\uDCCB [DYNAMICS] Entidade criada com retorno:", JSON.stringify(result_1, null, 2));
                        return [2 /*return*/, true];
                    case 7: return [4 /*yield*/, response.json()];
                    case 8:
                        result = _a.sent();
                        console.log("\u2705 [DYNAMICS] Resposta inesperada mas v\u00E1lida:", JSON.stringify(result, null, 2));
                        return [2 /*return*/, true];
                    case 9:
                        error_3 = _a.sent();
                        console.error("\u274C [DYNAMICS] Erro completo ao enviar dados:", error_3);
                        return [2 /*return*/, false];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    DynamicsIntegrationService.prototype.processarCotacaoAprovada = function (cotacao) {
        return __awaiter(this, void 0, Promise, function () {
            var cotacaoComItens, entidadesParaTestar, _i, entidadesParaTestar_1, entidade, entity, resultado, error_4, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Verificar se já foi processada
                        if (this.cotacoesProcessadas.has(cotacao.id)) {
                            console.log("\u26A0\uFE0F [DYNAMICS] Cota\u00E7\u00E3o " + cotacao.id + " j\u00E1 foi processada, ignorando...");
                            return [2 /*return*/, true];
                        }
                        this.cotacoesProcessadas.add(cotacao.id);
                        console.log("\uD83D\uDCCB [DYNAMICS] Processando cota\u00E7\u00E3o aprovada ID: " + cotacao.id);
                        return [4 /*yield*/, this.buscarCotacaoComItens(cotacao.id)];
                    case 1:
                        cotacaoComItens = _a.sent();
                        entidadesParaTestar = ['quotes', 'opportunities', 'incidents', 'leads'];
                        _i = 0, entidadesParaTestar_1 = entidadesParaTestar;
                        _a.label = 2;
                    case 2:
                        if (!(_i < entidadesParaTestar_1.length)) return [3 /*break*/, 7];
                        entidade = entidadesParaTestar_1[_i];
                        console.log("\uD83C\uDFAF [DYNAMICS] Tentando enviar como " + entidade + "...");
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
                        return [4 /*yield*/, this.enviarParaDynamics(entity, entidade)];
                    case 4:
                        resultado = _a.sent();
                        if (resultado) {
                            console.log("\u2705 [DYNAMICS] Cota\u00E7\u00E3o " + cotacao.id + " enviada com sucesso como " + entidade + "!");
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_4 = _a.sent();
                        console.log("\u274C [DYNAMICS] Falha ao enviar como " + entidade + ", tentando pr\u00F3xima...");
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        console.log("\u274C [DYNAMICS] Falha ao enviar cota\u00E7\u00E3o " + cotacao.id + " em todas as entidades testadas");
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando entidades dispon\u00EDveis...");
                        return [4 /*yield*/, this.consultarEntidadesDisponiveis()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        err_1 = _a.sent();
                        console.error('Erro ao consultar entidades:', err_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Processa uma cotação (criada) e tenta enviá-la para o Dynamics
     */
    DynamicsIntegrationService.prototype.processarCotacao = function (cotacao) {
        return __awaiter(this, void 0, Promise, function () {
            var cotacaoComItens, entidadesParaTestar, _i, entidadesParaTestar_2, entidade, entity, resultado, error_5, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCCB [DYNAMICS] Processando cota\u00E7\u00E3o ID: " + cotacao.id);
                        return [4 /*yield*/, this.buscarCotacaoComItens(cotacao.id)];
                    case 1:
                        cotacaoComItens = _a.sent();
                        entidadesParaTestar = ['quotes', 'opportunities', 'incidents', 'leads'];
                        _i = 0, entidadesParaTestar_2 = entidadesParaTestar;
                        _a.label = 2;
                    case 2:
                        if (!(_i < entidadesParaTestar_2.length)) return [3 /*break*/, 7];
                        entidade = entidadesParaTestar_2[_i];
                        console.log("\uD83C\uDFAF [DYNAMICS] Tentando enviar como " + entidade + "...");
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
                        return [4 /*yield*/, this.enviarParaDynamics(entity, entidade)];
                    case 4:
                        resultado = _a.sent();
                        if (resultado) {
                            console.log("\u2705 [DYNAMICS] Cota\u00E7\u00E3o " + cotacao.id + " enviada com sucesso como " + entidade + "!");
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        console.log("\u274C [DYNAMICS] Falha ao enviar como " + entidade + ", tentando pr\u00F3xima...");
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        console.log("\u274C [DYNAMICS] Falha ao enviar cota\u00E7\u00E3o " + cotacao.id + " em todas as entidades testadas");
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando entidades dispon\u00EDveis...");
                        return [4 /*yield*/, this.consultarEntidadesDisponiveis()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        err_2 = _a.sent();
                        console.error('Erro ao consultar entidades:', err_2);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Busca a cotação junto com seus itens para ter dados mais ricos
     */
    DynamicsIntegrationService.prototype.buscarCotacaoComItens = function (cotacaoId) {
        return __awaiter(this, void 0, Promise, function () {
            var supabase, _a, cotacao, errorCotacao, _b, itens, errorItens, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        supabase = require('../infra/supabase/connect')["default"];
                        return [4 /*yield*/, supabase
                                .from('cotacoes')
                                .select('*')
                                .eq('id', cotacaoId)
                                .single()];
                    case 1:
                        _a = _c.sent(), cotacao = _a.data, errorCotacao = _a.error;
                        if (errorCotacao) {
                            console.warn("\u26A0\uFE0F [DYNAMICS] Erro ao buscar cota\u00E7\u00E3o " + cotacaoId + ":", errorCotacao);
                            return [2 /*return*/, { id: cotacaoId, itens: [], orcamento_geral: 0 }];
                        }
                        return [4 /*yield*/, supabase
                                .from('cotacoes_itens')
                                .select('*')
                                .eq('cotacao_id', cotacaoId)];
                    case 2:
                        _b = _c.sent(), itens = _b.data, errorItens = _b.error;
                        if (errorItens) {
                            console.warn("\u26A0\uFE0F [DYNAMICS] Erro ao buscar itens da cota\u00E7\u00E3o " + cotacaoId + ":", errorItens);
                        }
                        console.log("\uD83D\uDCE6 [DYNAMICS] Cota\u00E7\u00E3o " + cotacaoId + " - Or\u00E7amento: R$ " + (cotacao.orcamento_geral || 0) + " - Itens: " + ((itens === null || itens === void 0 ? void 0 : itens.length) || 0));
                        return [2 /*return*/, __assign(__assign({}, cotacao), { itens: itens || [], customerNeed: this.montarCustomerNeed(itens || []) })];
                    case 3:
                        error_6 = _c.sent();
                        console.error("\u274C [DYNAMICS] Erro ao buscar cota\u00E7\u00E3o com itens:", error_6);
                        return [2 /*return*/, { id: cotacaoId, itens: [], orcamento_geral: 0 }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Monta a descrição customer need baseada nos pedidos dos itens
     */
    DynamicsIntegrationService.prototype.montarCustomerNeed = function (itens) {
        if (!itens || itens.length === 0) {
            return 'Cotação aprovada sem itens específicos';
        }
        var pedidos = itens
            .filter(function (item) { return item.pedido && item.pedido.trim(); })
            .map(function (item) { return "\u2022 " + item.pedido; })
            .join('\n');
        var itensComNome = itens
            .filter(function (item) { return item.item_nome && item.item_nome.trim(); })
            .map(function (item) { return "\u2022 " + item.item_nome + (item.quantidade ? " (Qtd: " + item.quantidade + ")" : ''); })
            .join('\n');
        var description = 'NECESSIDADES DO CLIENTE:\n';
        if (pedidos) {
            description += pedidos + '\n\n';
        }
        if (itensComNome) {
            description += 'ITENS COTADOS:\n' + itensComNome;
        }
        return description;
    };
    /**
     * Transforma uma cotação (com itens) em formato para Dynamics
     */
    DynamicsIntegrationService.prototype.transformCotacaoToDynamics = function (cotacao, entityName) {
        console.log("\uD83D\uDD04 [DYNAMICS] Transformando cota\u00E7\u00E3o " + cotacao.id + " para entidade " + entityName);
        var baseDescription = "Cota\u00E7\u00E3o gerada no SmartQuote - ID " + cotacao.id;
        var customerNeed = cotacao.customerNeed || this.extrairPedidosPrincipais(cotacao.itens);
        switch (entityName) {
            case 'quotes':
                return {
                    name: "Cota\u00E7\u00E3o #" + cotacao.id + " - SmartQuote",
                    description: baseDescription,
                    quotenumber: "SQ-" + cotacao.id,
                    totalamount: cotacao.orcamento_geral || 0,
                    statecode: 0,
                    statuscode: 1
                };
            case 'opportunities':
                return {
                    name: "Oportunidade #" + cotacao.id + " - SmartQuote",
                    description: baseDescription,
                    customerneed: customerNeed,
                    estimatedvalue: cotacao.orcamento_geral || 0,
                    statecode: 0,
                    statuscode: 1
                };
            case 'incidents':
                return {
                    title: "Ticket #" + cotacao.id + " - SmartQuote",
                    description: baseDescription,
                    ticketnumber: "SQ-" + cotacao.id,
                    prioritycode: 2,
                    severitycode: 1,
                    statecode: 0,
                    statuscode: 1
                };
            case 'leads':
                return {
                    fullname: "Lead SmartQuote #" + cotacao.id,
                    subject: "Lead da cota\u00E7\u00E3o #" + cotacao.id,
                    description: baseDescription,
                    firstname: 'SmartQuote',
                    lastname: "Lead " + cotacao.id,
                    companyname: 'SmartQuote System',
                    budgetamount: cotacao.orcamento_geral || 0,
                    statecode: 0,
                    statuscode: 1
                };
            default:
                return {
                    name: "Cota\u00E7\u00E3o #" + cotacao.id + " - SmartQuote",
                    description: baseDescription
                };
        }
    };
    /**
     * Extrai os pedidos principais dos itens de forma concisa para o campo customerneed
     */
    DynamicsIntegrationService.prototype.extrairPedidosPrincipais = function (itens) {
        if (!itens || itens.length === 0) {
            return 'Customer needs high-quality products and services to meet business requirements.';
        }
        // Buscar pedidos únicos e formatá-los de forma concisa
        var pedidosUnicos = __spreadArrays(new Set(itens
            .filter(function (item) { return item.pedido && item.pedido.trim(); })
            .map(function (item) { return item.pedido.trim(); })));
        if (pedidosUnicos.length === 0) {
            // Se não há pedidos específicos, criar baseado nos itens
            var itensNomes = itens
                .filter(function (item) { return item.item_nome && item.item_nome.trim(); })
                .slice(0, 3) // Pegar apenas os 3 primeiros
                .map(function (item) { return item.item_nome.trim(); });
            if (itensNomes.length > 0) {
                return "Customer needs " + itensNomes.join(', ') + " to enhance business operations.";
            }
        }
        // Juntar pedidos de forma legível
        if (pedidosUnicos.length === 1) {
            return pedidosUnicos[0];
        }
        else if (pedidosUnicos.length <= 3) {
            return pedidosUnicos.join('. ') + '.';
        }
        else {
            // Se há muitos pedidos, resumir
            return pedidosUnicos.slice(0, 2).join('. ') + (" and " + (pedidosUnicos.length - 2) + " additional requirements.");
        }
    };
    /**
     * Busca todas as oportunidades (opportunities) no Dynamics 365
     */
    DynamicsIntegrationService.prototype.listarOportunidades = function () {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var token, url, response, errorText, data, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Buscando oportunidades...");
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _b.sent();
                        url = this.config.webApiEndpoint + "/opportunities?$top=100";
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Authorization': "Bearer " + token,
                                    'Accept': 'application/json',
                                    'OData-MaxVersion': '4.0',
                                    'OData-Version': '4.0'
                                }
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Erro ao buscar oportunidades: " + response.status + " - " + errorText);
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        data = _b.sent();
                        console.log("\u2705 [DYNAMICS] " + (((_a = data.value) === null || _a === void 0 ? void 0 : _a.length) || 0) + " oportunidades encontradas");
                        return [2 /*return*/, data.value || []];
                    case 6:
                        error_7 = _b.sent();
                        console.error('❌ [DYNAMICS] Erro ao listar oportunidades:', error_7);
                        throw error_7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lista todas as entidades disponíveis no Dynamics (método direto)
     */
    DynamicsIntegrationService.prototype.listarEntidadesDisponiveis = function () {
        return __awaiter(this, void 0, Promise, function () {
            var token, headers, baseUrl, response, _a, _b, _c, data, entidades_1, error_8;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Listando entidades dispon\u00EDveis...");
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _d.sent();
                        headers = {
                            'Authorization': "Bearer " + token,
                            'Accept': 'application/json',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0'
                        };
                        baseUrl = this.config.webApiEndpoint;
                        // Consultar o endpoint raiz que deve listar todas as entidades
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando: " + baseUrl);
                        return [4 /*yield*/, fetch(baseUrl, {
                                method: 'GET',
                                headers: headers
                            })];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        _b = (_a = console).error;
                        _c = ["\u274C [DYNAMICS] Erro " + response.status + ":"];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        _b.apply(_a, _c.concat([_d.sent()]));
                        return [2 /*return*/, []];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        data = _d.sent();
                        console.log("\uD83D\uDCCB [DYNAMICS] Resposta do endpoint raiz:", JSON.stringify(data, null, 2));
                        entidades_1 = [];
                        if (data.value && Array.isArray(data.value)) {
                            // Se a resposta tem um array 'value'
                            data.value.forEach(function (item) {
                                if (item.name)
                                    entidades_1.push(item.name);
                                if (item.url)
                                    entidades_1.push(item.url);
                            });
                        }
                        else if (typeof data === 'object') {
                            // Se a resposta é um objeto, pegar as chaves
                            Object.keys(data).forEach(function (key) {
                                if (key !== '@odata.context') {
                                    entidades_1.push(key);
                                }
                            });
                        }
                        console.log("\uD83D\uDCCA [DYNAMICS] Entidades encontradas: " + entidades_1.length);
                        console.log("\uD83D\uDCCB [DYNAMICS] Primeiras 10:", entidades_1.slice(0, 10));
                        return [2 /*return*/, entidades_1];
                    case 6:
                        error_8 = _d.sent();
                        console.error("\u274C [DYNAMICS] Erro ao listar entidades:", error_8);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
     */
    DynamicsIntegrationService.prototype.consultarEntidadesDisponiveis = function () {
        return __awaiter(this, void 0, Promise, function () {
            var token, headers, metadataUrl, response, _a, _b, _c, metadataXml, entityMatches, quotesRelated_1, salesRelated_1, allEntities_1, error_9;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando entidades dispon\u00EDveis...");
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando metadados para descobrir entidades...");
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _d.sent();
                        headers = {
                            'Authorization': "Bearer " + token,
                            'Accept': 'application/xml',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0'
                        };
                        metadataUrl = this.config.webApiEndpoint + "/$metadata";
                        return [4 /*yield*/, fetch(metadataUrl, {
                                method: 'GET',
                                headers: headers
                            })];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        _b = (_a = console).error;
                        _c = ["\u274C [DYNAMICS] Erro " + response.status + ":"];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        _b.apply(_a, _c.concat([_d.sent()]));
                        return [2 /*return*/, {
                                entidades: [],
                                quotesRelated: [],
                                salesRelated: []
                            }];
                    case 4: return [4 /*yield*/, response.text()];
                    case 5:
                        metadataXml = _d.sent();
                        console.log("\uD83D\uDCCB [DYNAMICS] Metadados obtidos (" + metadataXml.length + " chars)");
                        entityMatches = metadataXml.match(/EntitySet Name="([^"]+)"/g) || [];
                        quotesRelated_1 = [];
                        salesRelated_1 = [];
                        allEntities_1 = [];
                        entityMatches.forEach(function (match) {
                            var _a;
                            var entityName = (_a = match.match(/Name="([^"]+)"/)) === null || _a === void 0 ? void 0 : _a[1];
                            if (entityName) {
                                allEntities_1.push(entityName);
                                var lowerName = entityName.toLowerCase();
                                if (lowerName.includes('quote')) {
                                    quotesRelated_1.push(entityName);
                                }
                                if (lowerName.includes('sales') || lowerName.includes('lead') || lowerName.includes('opportunity')) {
                                    salesRelated_1.push(entityName);
                                }
                            }
                        });
                        console.log("\uD83D\uDCCB [DYNAMICS] Entidades relacionadas a quotes:", quotesRelated_1);
                        console.log("\uD83D\uDCBC [DYNAMICS] Entidades relacionadas a sales:", salesRelated_1);
                        console.log("\uD83D\uDCCA [DYNAMICS] Total de entidades encontradas: " + allEntities_1.length);
                        return [2 /*return*/, {
                                entidades: allEntities_1.slice(0, 50),
                                quotesRelated: quotesRelated_1,
                                salesRelated: salesRelated_1
                            }];
                    case 6:
                        error_9 = _d.sent();
                        console.error("\u274C [DYNAMICS] Erro ao consultar entidades:", error_9);
                        return [2 /*return*/, {
                                entidades: [],
                                quotesRelated: [],
                                salesRelated: []
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Consulta entidades padrão no Dynamics
     */
    DynamicsIntegrationService.prototype.consultarEntidadesPadrao = function () {
        return __awaiter(this, void 0, Promise, function () {
            var token, headers, baseUrl, accountsResponse, accounts, _a, currenciesResponse, currencies, _b, pricelevelsResponse, pricelevels, _c, error_10;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 14, , 15]);
                        console.log("\uD83D\uDD0D [DYNAMICS] Consultando entidades padr\u00E3o...");
                        return [4 /*yield*/, this.getOAuthToken()];
                    case 1:
                        token = _d.sent();
                        headers = {
                            'Authorization': "Bearer " + token,
                            'Accept': 'application/json',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0'
                        };
                        baseUrl = this.config.webApiEndpoint;
                        return [4 /*yield*/, fetch(baseUrl + "/accounts?$top=5&$select=accountid,name", {
                                method: 'GET',
                                headers: headers
                            })];
                    case 2:
                        accountsResponse = _d.sent();
                        if (!accountsResponse.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, accountsResponse.json()];
                    case 3:
                        _a = (_d.sent()).value || [];
                        return [3 /*break*/, 5];
                    case 4:
                        _a = [];
                        _d.label = 5;
                    case 5:
                        accounts = _a;
                        console.log("\uD83D\uDCCB [DYNAMICS] Accounts encontradas: " + accounts.length);
                        return [4 /*yield*/, fetch(baseUrl + "/transactioncurrencies?$top=5&$select=transactioncurrencyid,currencyname,isocurrencycode", {
                                method: 'GET',
                                headers: headers
                            })];
                    case 6:
                        currenciesResponse = _d.sent();
                        if (!currenciesResponse.ok) return [3 /*break*/, 8];
                        return [4 /*yield*/, currenciesResponse.json()];
                    case 7:
                        _b = (_d.sent()).value || [];
                        return [3 /*break*/, 9];
                    case 8:
                        _b = [];
                        _d.label = 9;
                    case 9:
                        currencies = _b;
                        console.log("\uD83D\uDCB0 [DYNAMICS] Moedas encontradas: " + currencies.length);
                        return [4 /*yield*/, fetch(baseUrl + "/pricelevels?$top=5&$select=pricelevelid,name", {
                                method: 'GET',
                                headers: headers
                            })];
                    case 10:
                        pricelevelsResponse = _d.sent();
                        if (!pricelevelsResponse.ok) return [3 /*break*/, 12];
                        return [4 /*yield*/, pricelevelsResponse.json()];
                    case 11:
                        _c = (_d.sent()).value || [];
                        return [3 /*break*/, 13];
                    case 12:
                        _c = [];
                        _d.label = 13;
                    case 13:
                        pricelevels = _c;
                        console.log("\uD83D\uDCB2 [DYNAMICS] Price levels encontrados: " + pricelevels.length);
                        return [2 /*return*/, {
                                accounts: accounts,
                                currencies: currencies,
                                pricelevels: pricelevels
                            }];
                    case 14:
                        error_10 = _d.sent();
                        console.error("\u274C [DYNAMICS] Erro ao consultar entidades padr\u00E3o:", error_10);
                        return [2 /*return*/, {
                                accounts: [],
                                currencies: [],
                                pricelevels: []
                            }];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obtém configurações atuais (sem dados sensíveis)
     */
    DynamicsIntegrationService.prototype.obterConfig = function () {
        var _a = this.config, azureClientSecret = _a.azureClientSecret, safeConfig = __rest(_a, ["azureClientSecret"]);
        return safeConfig;
    };
    /**
     * Status da integração
     */
    DynamicsIntegrationService.prototype.obterStatusIntegracao = function () {
        return __awaiter(this, void 0, Promise, function () {
            var configurado, conectado, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        configurado = !!(this.config.webApiEndpoint &&
                            this.config.azureTenantId &&
                            this.config.azureClientId &&
                            this.config.azureClientSecret);
                        conectado = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        if (!configurado) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.testarConexao()];
                    case 2:
                        conectado = _b.sent();
                        _b.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        conectado = false;
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, {
                            configurado: configurado,
                            conectado: conectado,
                            ultimoTeste: new Date(),
                            config: this.obterConfig()
                        }];
                }
            });
        });
    };
    /**
     * Obtém informações do ambiente Dynamics (método simplificado)
     */
    DynamicsIntegrationService.prototype.obterInformacoesAmbiente = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                console.log("\u2139\uFE0F [DYNAMICS] M\u00E9todo obterInformacoesAmbiente simplificado");
                return [2 /*return*/, {
                        webApiEndpoint: this.config.webApiEndpoint,
                        message: "Usando configuração simplificada - apenas Web API endpoint necessário",
                        status: "active"
                    }];
            });
        });
    };
    return DynamicsIntegrationService;
}());
exports["default"] = DynamicsIntegrationService;
