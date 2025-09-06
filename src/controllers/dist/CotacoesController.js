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
exports.__esModule = true;
var CotacoesService_1 = require("../services/CotacoesService");
var CotacaoSchema_1 = require("../schemas/CotacaoSchema");
var CotacaoNotificationService_1 = require("../services/CotacaoNotificationService");
var DynamicsIntegrationService_1 = require("../services/DynamicsIntegrationService");
var CotacoesController = /** @class */ (function () {
    function CotacoesController() {
    }
    CotacoesController.prototype.create = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var body, parsed, errors, cotacao, notifError_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = __assign({}, req.body);
                        if (body.promptId && !body.prompt_id)
                            body.prompt_id = body.promptId;
                        if (body.aprovadoPor && !body.aprovado_por)
                            body.aprovado_por = body.aprovadoPor;
                        if (body.orcamentoGeral && !body.orcamento_geral)
                            body.orcamento_geral = body.orcamentoGeral;
                        if (body.dataAprovacao && !body.data_aprovacao)
                            body.data_aprovacao = body.dataAprovacao;
                        if (body.dataSolicitacao && !body.data_solicitacao)
                            body.data_solicitacao = body.dataSolicitacao;
                        if (body.prazoValidade && !body.prazo_validade)
                            body.prazo_validade = body.prazoValidade;
                        // mapear status antigo -> novo
                        if (body.status && ['pendente', 'aceite', 'recusado'].includes(body.status)) {
                            body.status = body.status === 'aceite' ? 'completa' : 'incompleta';
                        }
                        parsed = CotacaoSchema_1.cotacaoSchema.safeParse(body);
                        if (!parsed.success) {
                            errors = parsed.error.format();
                            return [2 /*return*/, res.status(400).json({ errors: errors })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, CotacoesService_1["default"].create(parsed.data)];
                    case 2:
                        cotacao = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, CotacaoNotificationService_1["default"].processarNotificacaoCotacao(cotacao, 'criada')];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        notifError_1 = _a.sent();
                        console.error('Erro ao criar notificação de cotação criada:', notifError_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, res.status(201).json({
                            message: 'Cotação cadastrada com sucesso.',
                            data: cotacao
                        })];
                    case 7:
                        err_1 = _a.sent();
                        return [2 /*return*/, res.status(400).json({ error: err_1.message })];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CotacoesController.prototype.getAll = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var cotacoes, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, CotacoesService_1["default"].getAll()];
                    case 1:
                        cotacoes = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: 'Lista de cotações.',
                                data: cotacoes
                            })];
                    case 2:
                        err_2 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: err_2.message })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CotacoesController.prototype.getById = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var id, cotacao, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, CotacoesService_1["default"].getById(Number(id))];
                    case 1:
                        cotacao = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: 'Cotação encontrada.',
                                data: cotacao
                            })];
                    case 2:
                        err_3 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: err_3.message })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CotacoesController.prototype["delete"] = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var id, cotacaoParaDeletar, error_1, notifError_2, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        id = req.params.id;
                        cotacaoParaDeletar = void 0;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, CotacoesService_1["default"].getById(Number(id))];
                    case 2:
                        cotacaoParaDeletar = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        // Se não encontrou a cotação, continua com a deleção
                        console.warn('Cotação não encontrada para notificação de deleção:', id);
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, CotacoesService_1["default"]["delete"](Number(id))];
                    case 5:
                        _a.sent();
                        if (!cotacaoParaDeletar) return [3 /*break*/, 9];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, CotacaoNotificationService_1["default"].processarNotificacaoCotacao(cotacaoParaDeletar, 'deletada')];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        notifError_2 = _a.sent();
                        console.error('Erro ao criar notificação de cotação deletada:', notifError_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, res.status(200).json({ message: 'Cotação deletada com sucesso.' })];
                    case 10:
                        err_4 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: err_4.message })];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    CotacoesController.prototype.patch = function (req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, Promise, function () {
            var id, updates, aprov, usuarioId, usuarioRole, usuarioPosition, userSvc, u, _k, LIMITE_MANAGER, valorReferencia, atual, _l, numeroValor, acao, permitido, cotacaoAnterior, error_2, cotacaoAtualizada, notifError_3, dynamicsService, resultado, dynError_1, err_5;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        _m.trys.push([0, 23, , 24]);
                        id = req.params.id;
                        updates = __assign({}, req.body);
                        if (updates.promptId && !updates.prompt_id)
                            updates.prompt_id = updates.promptId;
                        if (updates.aprovadoPor && !updates.aprovado_por)
                            updates.aprovado_por = updates.aprovadoPor;
                        if (updates.orcamentoGeral && !updates.orcamento_geral)
                            updates.orcamento_geral = updates.orcamentoGeral;
                        if (updates.dataAprovacao && !updates.data_aprovacao)
                            updates.data_aprovacao = updates.dataAprovacao;
                        if (updates.dataSolicitacao && !updates.data_solicitacao)
                            updates.data_solicitacao = updates.dataSolicitacao;
                        if (updates.prazoValidade && !updates.prazo_validade)
                            updates.prazo_validade = updates.prazoValidade;
                        if (updates.status && ['pendente', 'aceite', 'recusado'].includes(updates.status)) {
                            updates.status = updates.status === 'aceite' ? 'completa' : 'incompleta';
                        }
                        if (!Object.prototype.hasOwnProperty.call(updates, 'aprovacao')) return [3 /*break*/, 9];
                        aprov = updates.aprovacao === true || updates.aprovacao === 'true';
                        usuarioId = updates.aprovado_por || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                        usuarioRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || req.userRole || updates.user_role;
                        usuarioPosition = (_c = req.user) === null || _c === void 0 ? void 0 : _c.position;
                        // fallback adicional: se não veio role, tentar extrair de posição/position enviada ou armazenada
                        if (!usuarioRole) {
                            usuarioRole = updates.position || updates.posicao || updates.perfil;
                        }
                        if (!(!usuarioRole && usuarioId)) return [3 /*break*/, 4];
                        _m.label = 1;
                    case 1:
                        _m.trys.push([1, 3, , 4]);
                        userSvc = require('../services/UserService')["default"];
                        return [4 /*yield*/, userSvc.getById(String(usuarioId))];
                    case 2:
                        u = _m.sent();
                        usuarioRole = ((_d = u) === null || _d === void 0 ? void 0 : _d.position) || ((_e = u) === null || _e === void 0 ? void 0 : _e.role) || ((_f = u) === null || _f === void 0 ? void 0 : _f["function"]);
                        return [3 /*break*/, 4];
                    case 3:
                        _k = _m.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        LIMITE_MANAGER = 50000000;
                        valorReferencia = updates.orcamento_geral;
                        if (!(valorReferencia == null)) return [3 /*break*/, 8];
                        _m.label = 5;
                    case 5:
                        _m.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, CotacoesService_1["default"].getById(Number(id))];
                    case 6:
                        atual = _m.sent();
                        valorReferencia = (_h = (_g = atual) === null || _g === void 0 ? void 0 : _g.orcamento_geral) !== null && _h !== void 0 ? _h : (_j = atual) === null || _j === void 0 ? void 0 : _j.valor;
                        return [3 /*break*/, 8];
                    case 7:
                        _l = _m.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        numeroValor = Number(valorReferencia) || 0;
                        acao = aprov ? 'aprovar' : 'rejeitar';
                        permitido = false;
                        if (usuarioRole === 'admin') {
                            permitido = true;
                        }
                        else if (usuarioRole === 'manager') {
                            permitido = numeroValor < LIMITE_MANAGER;
                        }
                        else {
                            permitido = false;
                        }
                        console.log('[CotacoesController.patch] decisão de aprovação/rejeição', { id: id, usuarioId: usuarioId, usuarioRole: usuarioRole, usuarioPosition: usuarioPosition, numeroValor: numeroValor, aprov: aprov });
                        if (!permitido) {
                            console.warn('Permissão negada aprovação/rejeição', {
                                cotacaoId: id,
                                usuarioId: usuarioId,
                                usuarioRole: usuarioRole,
                                usuarioPosition: usuarioPosition,
                                numeroValor: numeroValor,
                                limite: LIMITE_MANAGER,
                                acao: acao
                            });
                            return [2 /*return*/, res.status(403).json({ error: "Usu\u00E1rio sem permiss\u00E3o para " + acao + " esta cota\u00E7\u00E3o (perfil ou valor excede limite para manager)." })];
                        }
                        if (aprov) {
                            updates.status = 'completa';
                            updates.data_aprovacao = new Date().toISOString();
                            if (usuarioId)
                                updates.aprovado_por = usuarioId;
                        }
                        else {
                            updates.status = 'incompleta';
                            updates.data_aprovacao = null;
                            if (usuarioId && !updates.aprovado_por)
                                updates.aprovado_por = usuarioId;
                        }
                        _m.label = 9;
                    case 9:
                        cotacaoAnterior = void 0;
                        _m.label = 10;
                    case 10:
                        _m.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, CotacoesService_1["default"].getById(Number(id))];
                    case 11:
                        cotacaoAnterior = _m.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        error_2 = _m.sent();
                        console.warn('Cotação não encontrada para comparação de mudanças:', id);
                        return [3 /*break*/, 13];
                    case 13: return [4 /*yield*/, CotacoesService_1["default"].updatePartial(Number(id), updates)];
                    case 14:
                        cotacaoAtualizada = _m.sent();
                        if (!(cotacaoAnterior && cotacaoAtualizada)) return [3 /*break*/, 22];
                        _m.label = 15;
                    case 15:
                        _m.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, CotacaoNotificationService_1["default"].analisarENotificarMudancas(cotacaoAnterior, cotacaoAtualizada)];
                    case 16:
                        _m.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        notifError_3 = _m.sent();
                        console.error('Erro ao processar notificações de mudanças na cotação:', notifError_3);
                        return [3 /*break*/, 18];
                    case 18:
                        if (!(cotacaoAnterior.aprovacao !== true &&
                            cotacaoAtualizada.aprovacao === true)) return [3 /*break*/, 22];
                        _m.label = 19;
                    case 19:
                        _m.trys.push([19, 21, , 22]);
                        console.log("\uD83D\uDE80 [DYNAMICS-AUTO] Cota\u00E7\u00E3o " + id + " foi aprovada, enviando para Dynamics...");
                        dynamicsService = new DynamicsIntegrationService_1["default"]();
                        return [4 /*yield*/, dynamicsService.processarCotacaoAprovada(cotacaoAtualizada)];
                    case 20:
                        resultado = _m.sent();
                        if (resultado) {
                            console.log("\u2705 [DYNAMICS-AUTO] Cota\u00E7\u00E3o " + id + " enviada para Dynamics com sucesso!");
                        }
                        else {
                            console.warn("\u26A0\uFE0F [DYNAMICS-AUTO] Cota\u00E7\u00E3o " + id + " n\u00E3o foi enviada para Dynamics (falha no processamento)");
                        }
                        return [3 /*break*/, 22];
                    case 21:
                        dynError_1 = _m.sent();
                        console.error("\u274C [DYNAMICS-AUTO] Erro ao enviar cota\u00E7\u00E3o " + id + " aprovada para Dynamics:", dynError_1);
                        return [3 /*break*/, 22];
                    case 22: return [2 /*return*/, res.status(200).json({
                            message: 'Cotação atualizada com sucesso.',
                            data: cotacaoAtualizada
                        })];
                    case 23:
                        err_5 = _m.sent();
                        return [2 /*return*/, res.status(500).json({ error: err_5.message })];
                    case 24: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove um placeholder (faltante) da cotação.
     * Agora os faltantes são representados por registros em cotacoes_itens com status=false e campo pedido.
     */
    CotacoesController.prototype.removeFaltante = function (req, res) {
        return __awaiter(this, void 0, Promise, function () {
            var id, _a, index, query, nome, svc, elementoRemovido, removed, removed, removed, placeholdersRestantes, novoStatus, cotacaoAtualizada, err_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        id = req.params.id;
                        _a = req.body, index = _a.index, query = _a.query, nome = _a.nome;
                        if (index === undefined && !query && !nome) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'É necessário fornecer index, query ou nome para identificar o elemento a ser removido'
                                })];
                        }
                        svc = require('../services/CotacoesItensService')["default"];
                        elementoRemovido = null;
                        if (!(index !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, svc.removePlaceholderByIndex(Number(id), Number(index))];
                    case 1:
                        removed = _b.sent();
                        if (removed)
                            elementoRemovido = removed;
                        else
                            return [2 /*return*/, res.status(400).json({ error: 'Índice inválido ou placeholder não encontrado' })];
                        return [3 /*break*/, 6];
                    case 2:
                        if (!query) return [3 /*break*/, 4];
                        return [4 /*yield*/, svc.removePlaceholderByPedido(Number(id), String(query))];
                    case 3:
                        removed = _b.sent();
                        if (removed)
                            elementoRemovido = removed;
                        return [3 /*break*/, 6];
                    case 4:
                        if (!nome) return [3 /*break*/, 6];
                        return [4 /*yield*/, svc.removePlaceholderByNome(Number(id), String(nome))];
                    case 5:
                        removed = _b.sent();
                        if (removed)
                            elementoRemovido = removed;
                        _b.label = 6;
                    case 6:
                        if (!elementoRemovido) {
                            return [2 /*return*/, res.status(404).json({ error: 'Placeholder não encontrado' })];
                        }
                        return [4 /*yield*/, svc.listPlaceholders(Number(id))];
                    case 7:
                        placeholdersRestantes = _b.sent();
                        novoStatus = placeholdersRestantes.length === 0 ? 'completa' : 'incompleta';
                        return [4 /*yield*/, CotacoesService_1["default"].updatePartial(Number(id), { status: novoStatus })];
                    case 8:
                        cotacaoAtualizada = _b.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: 'Placeholder removido com sucesso.',
                                data: {
                                    elementoRemovido: elementoRemovido,
                                    faltantesRestantes: placeholdersRestantes.length,
                                    novoStatus: novoStatus,
                                    cotacao: cotacaoAtualizada
                                }
                            })];
                    case 9:
                        err_6 = _b.sent();
                        return [2 /*return*/, res.status(500).json({ error: err_6.message })];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return CotacoesController;
}());
exports["default"] = new CotacoesController();
