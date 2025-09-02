/**
 * Script de teste para funcionalidade de notificações lidas/não lidas
 * Execute este script após iniciar o servidor para testar os novos endpoints
 */

const BASE_URL = 'http://localhost:2000/api';

// Função auxiliar para fazer requests
async function makeRequest(url: string, options: any = {}) {
  try {
    console.log(`\n🔄 ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error:`, error);
    return { error };
  }
}

// Função principal de teste
async function testNotificationReadFunctionality() {
  console.log('🧪 === TESTE DE FUNCIONALIDADE DE NOTIFICAÇÕES LIDAS/NÃO LIDAS ===\n');

  // 1. Listar todas as notificações
  console.log('1️⃣ Listando todas as notificações:');
  const allNotifications = await makeRequest(`${BASE_URL}/notifications`);

  if (allNotifications.data?.data?.length > 0) {
    const firstNotificationId = allNotifications.data.data[0].id;
    
    // 2. Marcar uma notificação como lida
    console.log('\n2️⃣ Marcando primeira notificação como lida:');
    await makeRequest(`${BASE_URL}/notifications/${firstNotificationId}/read`, {
      method: 'PATCH'
    });

    // 3. Listar notificações não lidas
    console.log('\n3️⃣ Listando notificações não lidas:');
    await makeRequest(`${BASE_URL}/notifications/unread`);

    // 4. Contar notificações não lidas
    console.log('\n4️⃣ Contando notificações não lidas:');
    await makeRequest(`${BASE_URL}/notifications/unread/count`);

    // 5. Marcar múltiplas notificações como lidas (se houver mais de uma)
    if (allNotifications.data.data.length > 1) {
      console.log('\n5️⃣ Marcando múltiplas notificações como lidas:');
      const multipleIds = allNotifications.data.data.slice(0, 3).map((n: any) => n.id);
      await makeRequest(`${BASE_URL}/notifications/read/multiple`, {
        method: 'PATCH',
        body: JSON.stringify({ ids: multipleIds })
      });
    }

    // 6. Marcar todas as notificações como lidas
    console.log('\n6️⃣ Marcando todas as notificações como lidas:');
    await makeRequest(`${BASE_URL}/notifications/read/all`, {
      method: 'PATCH'
    });

    // 7. Verificar contagem final de não lidas
    console.log('\n7️⃣ Verificação final - contando não lidas:');
    await makeRequest(`${BASE_URL}/notifications/unread/count`);

  } else {
    console.log('❌ Nenhuma notificação encontrada para testar');
    
    // Criar uma notificação de teste
    console.log('\n🔧 Criando notificação de teste:');
    await makeRequest(`${BASE_URL}/notifications`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Notificação de Teste',
        message: 'Esta é uma notificação criada para testar a funcionalidade de lida/não lida',
        type: 'info',
        user_id: 'test-user'
      })
    });
    
    console.log('\n🔄 Execute o script novamente para testar com a nova notificação');
  }

  console.log('\n✅ === TESTE CONCLUÍDO ===');
}

// Executar teste apenas se este arquivo for executado diretamente
if (require.main === module) {
  testNotificationReadFunctionality().catch(console.error);
}

export { testNotificationReadFunctionality };
