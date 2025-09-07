import supabase from '../src/infra/supabase/connect';

async function testEmailValidation() {
  console.log('🧪 Testando validação case-sensitive de emails...\n');

  // Teste 1: Verificar todos os emails na tabela users
  console.log('📋 1. Emails na tabela users:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, position');

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message);
  } else {
    users?.forEach(user => {
      console.log(`   - ${user.email} (${user.position})`);
    });
  }

  // Teste 2: Verificar busca case-sensitive
  console.log('\n🔍 2. Teste de busca case-sensitive:');
  
  const testEmails = [
    'bartolomeugasparbg@gmail.com',
    'Bartolomeugasparbg@gmail.com',
    'BARTOLOMEUGASPARBG@gmail.com'
  ];

  for (const testEmail of testEmails) {
    const { data: result, error } = await supabase
      .from('users')
      .select('email, position')
      .eq('email', testEmail)
      .single();

    if (error) {
      console.log(`   ❌ ${testEmail} → Não encontrado`);
    } else {
      console.log(`   ✅ ${testEmail} → Encontrado: ${result.email} (${result.position})`);
    }
  }

  // Teste 3: Verificar auth users no Supabase
  console.log('\n👤 3. Verificar usuários no Supabase Auth:');
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários auth:', authError.message);
    } else {
      authUsers.users?.forEach(user => {
        console.log(`   - Auth: ${user.email} (ID: ${user.id})`);
      });
    }
  } catch (e) {
    console.log('   ⚠️ Não foi possível acessar admin.listUsers (precisa service role key)');
  }

  console.log('\n🏁 Teste finalizado.');
}

testEmailValidation().catch(console.error);
