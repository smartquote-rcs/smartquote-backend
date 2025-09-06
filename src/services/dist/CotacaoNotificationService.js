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
exports.CotacaoNotificationService = void 0;
var NotificationService_1 = require("./NotificationService");
var DynamicsIntegrationService_1 = require("./DynamicsIntegrationService");
var CotacaoNotificationService = /** @class */ (function () {
    function CotacaoNotificationService() {
        this.notificationService = new NotificationService_1.NotificationService();
        this.dynamicsService = new DynamicsIntegrationService_1["default"]();
    }
    /**
     * Cria notificação quando uma nova cotação é criada
     */
    CotacaoNotificationService.prototype.notificarCotacaoCriada = function (cotacao) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var notification, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        notification = {
                            title: 'Nova Cotação Criada',
                            subject: "Nova cota\u00E7\u00E3o criada para " + (((_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome) || 'Produto') + " (ID: " + cotacao.id + ")",
                            type: 'cotacao_criada',
                            url_redir: "/cotacoes/" + cotacao.id
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.notificationService.createIfNotExists(notification)];
                    case 2:
                        _b.sent();
                        console.log("\uD83D\uDCCB [COTACAO-NOTIF] Notifica\u00E7\u00E3o criada para nova cota\u00E7\u00E3o ID: " + cotacao.id);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error("\uD83D\uDCCB [COTACAO-NOTIF] Erro ao criar notifica\u00E7\u00E3o para cota\u00E7\u00E3o " + cotacao.id + ":", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cria notificação quando uma cotação é aprovada
     */
    CotacaoNotificationService.prototype.notificarCotacaoAprovada = function (cotacao) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var notification, dynamicsSuccess, dynamicsError_1, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        notification = {
                            title: 'Cotação Aprovada',
                            subject: "Cota\u00E7\u00E3o aprovada para " + (((_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome) || 'Produto') + " (ID: " + cotacao.id + ") - Motivo: " + cotacao.motivo,
                            type: 'cotacao_aprovada',
                            url_redir: "/cotacoes/" + cotacao.id
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.notificationService.createIfNotExists(notification)];
                    case 2:
                        _b.sent();
                        console.log("\u2705 [COTACAO-NOTIF] Notifica\u00E7\u00E3o criada para cota\u00E7\u00E3o aprovada ID: " + cotacao.id);
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        console.log("\uD83D\uDD04 [COTACAO-NOTIF] Enviando cota\u00E7\u00E3o aprovada para Dynamics 365...");
                        return [4 /*yield*/, this.dynamicsService.processarCotacaoAprovada(cotacao)];
                    case 4:
                        dynamicsSuccess = _b.sent();
                        if (dynamicsSuccess) {
                            console.log("\uD83C\uDF89 [COTACAO-NOTIF] Cota\u00E7\u00E3o " + cotacao.id + " enviada para Dynamics com sucesso!");
                        }
                        else {
                            console.warn("\u26A0\uFE0F [COTACAO-NOTIF] Falha ao enviar cota\u00E7\u00E3o " + cotacao.id + " para Dynamics (processo continua)");
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        dynamicsError_1 = _b.sent();
                        console.error("\u274C [COTACAO-NOTIF] Erro na integra\u00E7\u00E3o com Dynamics para cota\u00E7\u00E3o " + cotacao.id + ":", dynamicsError_1);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        console.error("\uD83D\uDCCB [COTACAO-NOTIF] Erro ao criar notifica\u00E7\u00E3o de aprova\u00E7\u00E3o para cota\u00E7\u00E3o " + cotacao.id + ":", error_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cria notificação quando uma cotação é rejeitada
     */
    CotacaoNotificationService.prototype.notificarCotacaoRejeitada = function (cotacao) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var notification, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        notification = {
                            title: 'Cotação Rejeitada',
                            subject: "Cota\u00E7\u00E3o rejeitada para " + (((_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome) || 'Produto') + " (ID: " + cotacao.id + ") - Motivo: " + cotacao.motivo,
                            type: 'cotacao_rejeitada',
                            url_redir: "/cotacoes/" + cotacao.id
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.notificationService.createIfNotExists(notification)];
                    case 2:
                        _b.sent();
                        console.log("\u274C [COTACAO-NOTIF] Notifica\u00E7\u00E3o criada para cota\u00E7\u00E3o rejeitada ID: " + cotacao.id);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _b.sent();
                        console.error("\uD83D\uDCCB [COTACAO-NOTIF] Erro ao criar notifica\u00E7\u00E3o de rejei\u00E7\u00E3o para cota\u00E7\u00E3o " + cotacao.id + ":", error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cria notificação quando uma cotação é deletada
     */
    CotacaoNotificationService.prototype.notificarCotacaoDeletada = function (cotacao) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var notification, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        notification = {
                            title: 'Cotação Deletada',
                            subject: "Cota\u00E7\u00E3o deletada para " + (((_a = cotacao.produto) === null || _a === void 0 ? void 0 : _a.nome) || 'Produto') + " (ID: " + cotacao.id + ")",
                            type: 'cotacao_deletada',
                            url_redir: "/cotacoes"
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.notificationService.createIfNotExists(notification)];
                    case 2:
                        _b.sent();
                        console.log("\uD83D\uDDD1\uFE0F [COTACAO-NOTIF] Notifica\u00E7\u00E3o criada para cota\u00E7\u00E3o deletada ID: " + cotacao.id);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _b.sent();
                        console.error("\uD83D\uDCCB [COTACAO-NOTIF] Erro ao criar notifica\u00E7\u00E3o de dele\u00E7\u00E3o para cota\u00E7\u00E3o " + cotacao.id + ":", error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processa notificação baseada no status da cotação
     */
    CotacaoNotificationService.prototype.processarNotificacaoCotacao = function (cotacao, acao) {
        return __awaiter(this, void 0, Promise, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = acao;
                        switch (_a) {
                            case 'criada': return [3 /*break*/, 1];
                            case 'aprovada': return [3 /*break*/, 3];
                            case 'rejeitada': return [3 /*break*/, 5];
                            case 'deletada': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.notificarCotacaoCriada(cotacao)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 3: return [4 /*yield*/, this.notificarCotacaoAprovada(cotacao)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 5: return [4 /*yield*/, this.notificarCotacaoRejeitada(cotacao)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 7: return [4 /*yield*/, this.notificarCotacaoDeletada(cotacao)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        console.warn("\uD83D\uDCCB [COTACAO-NOTIF] A\u00E7\u00E3o desconhecida: " + acao);
                        _b.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analisa mudanças na cotação e determina que tipo de notificação enviar
     */
    CotacaoNotificationService.prototype.analisarENotificarMudancas = function (cotacaoAntiga, cotacaoNova) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!cotacaoAntiga) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processarNotificacaoCotacao(cotacaoNova, 'criada')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (!(cotacaoAntiga.aprovacao !== cotacaoNova.aprovacao)) return [3 /*break*/, 6];
                        if (!cotacaoNova.aprovacao) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processarNotificacaoCotacao(cotacaoNova, 'aprovada')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.processarNotificacaoCotacao(cotacaoNova, 'rejeitada')];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove notificações relacionadas a uma cotação específica
     */
    CotacaoNotificationService.prototype.removerNotificacoesCotacao = function (cotacaoId) {
        return __awaiter(this, void 0, Promise, function () {
            var todasNotificacoes, notificacoesCotacao, _i, notificacoesCotacao_1, notificacao, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.notificationService.getAll()];
                    case 1:
                        todasNotificacoes = _a.sent();
                        notificacoesCotacao = todasNotificacoes.filter(function (notif) {
                            var _a;
                            return notif.type.startsWith('cotacao_') &&
                                (notif.subject.includes("(ID: " + cotacaoId + ")") || ((_a = notif.url_redir) === null || _a === void 0 ? void 0 : _a.includes("/cotacoes/" + cotacaoId)));
                        });
                        _i = 0, notificacoesCotacao_1 = notificacoesCotacao;
                        _a.label = 2;
                    case 2:
                        if (!(_i < notificacoesCotacao_1.length)) return [3 /*break*/, 5];
                        notificacao = notificacoesCotacao_1[_i];
                        return [4 /*yield*/, this.notificationService["delete"](notificacao.id)];
                    case 3:
                        _a.sent();
                        console.log("\uD83E\uDDF9 [COTACAO-NOTIF] Notifica\u00E7\u00E3o removida: " + notificacao.subject);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        console.error("\uD83D\uDCCB [COTACAO-NOTIF] Erro ao remover notifica\u00E7\u00F5es da cota\u00E7\u00E3o " + cotacaoId + ":", error_5);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return CotacaoNotificationService;
}());
exports.CotacaoNotificationService = CotacaoNotificationService;
exports["default"] = new CotacaoNotificationService();
