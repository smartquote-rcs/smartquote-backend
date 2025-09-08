"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
// Helper para obter registro interno de usuário e mapear posição para role
async function loadAppUser(email) {
    try {
        // Busca case-sensitive - email deve ser exatamente igual ao da DB
        const { data, error } = await connect_1.default
            .from('users')
            .select('id, email, position')
            .eq('email', email)
            .single();
        if (error || !data)
            return null;
        const pos = (data.position || '').toString().trim().toLowerCase();
        let role = 'user';
        if (['admin', 'administrator', 'administrador'].some(k => k === pos) || pos.includes('admin'))
            role = 'admin';
        else if (['manager', 'gestor', 'coordenador'].some(k => k === pos) || pos.includes('manager') || pos.includes('gestor'))
            role = 'manager';
        // log resolução
        console.log('[authMiddleware] user role resolved', { email: data.email, position: data.position, role });
        return { id: data.id, email: data.email, position: data.position, role };
    }
    catch {
        return null;
    }
}
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await connect_1.default.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    // Enriquecer com dados da tabela users para obter position/role
    let enriched = null;
    if (user.email) {
        enriched = await loadAppUser(user.email);
        // VALIDAÇÃO CASE-SENSITIVE: Se o usuário não existe na tabela users, rejeitar
        if (!enriched) {
            console.log(`❌ [authMiddleware] Usuário ${user.email} não encontrado na tabela users - acesso negado`);
            return res.status(403).json({
                error: 'Acesso negado. Usuário não encontrado no sistema interno. Contate o administrador.'
            });
        }
    }
    req.user = {
        id: enriched?.id || user.id,
        email: user.email,
        role: enriched?.role || 'user',
        position: enriched?.position,
        raw: user
    };
    next();
}
//# sourceMappingURL=authMiddleware.js.map