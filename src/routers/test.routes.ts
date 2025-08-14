import { Router } from "express";
import supabase from "../infra/supabase/connect";

const testRouter = Router();

// Rota para testar conexão com a base de dados
testRouter.get("/", async (req, res) => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Primeiro, vamos ver que tabelas existem
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_names');
    
    if (tablesError) {
      console.log('Erro ao usar RPC, tentando método alternativo...');
      
      // Método alternativo: tentar consultar diretamente algumas tabelas conhecidas
      const testTables = ['fornecedores', 'Fornecedores', 'users', 'produtos'];
      const results: any = {};
      
      for (const tableName of testTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          results[tableName] = error ? `Erro: ${error.message}` : `Sucesso: ${data?.length || 0} registros`;
        } catch (e) {
          results[tableName] = `Exceção: ${e}`;
        }
      }
      
      return res.json({
        success: true,
        message: "Teste de conexão concluído",
        table_tests: results
      });
    }
    
    return res.json({
      success: true,
      message: "Conexão testada com sucesso",
      tables
    });
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default testRouter;
