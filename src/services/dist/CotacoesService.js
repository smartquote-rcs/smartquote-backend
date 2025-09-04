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
var connect_1 = require("../infra/supabase/connect");
var CotacoesService = /** @class */ (function () {
    function CotacoesService() {
    }
    /**
     * Remove todas as cotações cujo prazo_validade já expirou (menor que hoje)
     */
    CotacoesService.prototype.deleteExpired = function () {
        return __awaiter(this, void 0, Promise, function () {
            var today, todayStr, _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        today = new Date();
                        today.setHours(0, 0, 0, 0);
                        todayStr = today.toISOString().slice(0, 10);
                        return [4 /*yield*/, connect_1["default"]
                                .from('cotacoes')["delete"]()
                                .lt('prazo_validade', todayStr)];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            throw new Error("Failed to delete expired cotacoes: " + error.message);
                        }
                        if (Array.isArray(data)) {
                            return [2 /*return*/, data.length];
                        }
                        return [2 /*return*/, 0];
                }
            });
        });
    };
    CotacoesService.prototype.create = function (CotacaoData) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, connect_1["default"]
                            .from('cotacoes')
                            .insert(CotacaoData)
                            .select("\n        *,\n        prompt:prompts(id, texto_original)\n      ")
                            .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            throw new Error("Failed to create cotacao: " + error.message);
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    CotacoesService.prototype.getAll = function () {
        return __awaiter(this, void 0, Promise, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, connect_1["default"]
                            .from('cotacoes')
                            .select("\n        *,\n        prompt:prompts(id, texto_original)\n      ")
                            .order('cadastrado_em', { ascending: false })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            throw new Error("Failed to list cotacoes: " + error.message);
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    CotacoesService.prototype.getById = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83D\uDD0D [COTACOES-SERVICE] Buscando cota\u00E7\u00E3o ID: " + id);
                        return [4 /*yield*/, connect_1["default"]
                                .from('cotacoes')
                                .select("\n        *,\n        prompt:prompts(id, texto_original)\n      ")
                                .eq('id', id)];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            console.error("\u274C [COTACOES-SERVICE] Erro ao buscar cota\u00E7\u00E3o " + id + ":", error);
                            throw new Error("Failed to get cotacao by ID: " + error.message);
                        }
                        if (!data || data.length === 0) {
                            console.warn("\u26A0\uFE0F [COTACOES-SERVICE] Cota\u00E7\u00E3o " + id + " n\u00E3o encontrada");
                            return [2 /*return*/, null];
                        }
                        if (data.length > 1) {
                            console.warn("\u26A0\uFE0F [COTACOES-SERVICE] M\u00FAltiplas cota\u00E7\u00F5es encontradas para ID " + id + ", usando a primeira");
                        }
                        console.log("\u2705 [COTACOES-SERVICE] Cota\u00E7\u00E3o " + id + " encontrada:", {
                            id: data[0].id,
                            aprovacao: data[0].aprovacao,
                            orcamento_geral: data[0].orcamento_geral
                        });
                        return [2 /*return*/, data[0]];
                }
            });
        });
    };
    CotacoesService.prototype["delete"] = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connect_1["default"]
                            .from('cotacoes')["delete"]()
                            .eq('id', id)];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            throw new Error("Failed to delete cotacao: " + error.message);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    CotacoesService.prototype.updatePartial = function (id, dataToUpdate) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, connect_1["default"]
                            .from('cotacoes')
                            .update(dataToUpdate)
                            .eq('id', id)
                            .select("\n        *,\n        prompt:prompts(id, texto_original)\n      ")
                            .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            throw new Error("Failed to update cotacao: " + error.message);
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    return CotacoesService;
}());
exports["default"] = new CotacoesService();
