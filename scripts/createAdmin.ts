import { passwordHash } from '../src/utils/passwordHash';
import supabase from '../src/infra/supabase/connect';
import AuthService from '../src/services/AuthService';
import UserService from '../src/services/UserService';



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
    const user = await UserService.create(adminData);
    console.log('Admin criado com sucesso:', user);
  } catch (error: any) {
    console.error('Erro ao criar admin:', error.message);
  }
}

createAdmin().then(() => process.exit());
