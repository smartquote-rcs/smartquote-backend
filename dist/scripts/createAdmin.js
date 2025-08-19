"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = __importDefault(require("../src/services/UserService"));
async function createAdmin() {
    const adminData = {
        name: 'Alfredo',
        email: 'alfredo@hotmail.com',
        contact: '999999999',
        password: 'Admin123!',
        department: 'TI',
        position: 'admin',
    };
    try {
        // Cria o usuário no Auth e na tabela users
        const user = await UserService_1.default.create(adminData);
        console.log('Admin criado com sucesso:', user);
    }
    catch (error) {
        console.error('Erro ao criar admin:', error.message);
    }
}
createAdmin().then(() => process.exit());
//# sourceMappingURL=createAdmin.js.map