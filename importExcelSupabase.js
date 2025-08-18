import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Conexão com o Supabase
const supabaseUrl = 'https://zskyvltkzcpkelusvbbm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza3l2bHRremNwa2VsdXN2YmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzMsImV4cCI6MjA3MDE4NjA3M30.SSkuEXqIIG316-9d-YX1hbj-XRIN0uBZr6KEsjuhLuc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para autenticar o usuário
async function autenticarUsuario() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'unionassessoriajuridica@gmail.com', // Substitua pelo email do usuário
    password: 'Madugi001@', // Substitua pela senha do usuário
  });
  if (error) throw new Error(`Erro ao autenticar: ${error.message}`);
  return data.user.id; // Retorna o user_id autenticado
}

// Lê o arquivo Excel
const workbook = XLSX.readFile('clientes_e_processos.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Função para importar dados
async function importarDados() {
  try {
    // Autentica o usuário
    const userId = await autenticarUsuario();

    // Insere clientes únicos
    const clientesMap = new Map();
    for (const row of data) {
      const cliente = {
        nome: row.NomeCliente,
        cpf_cnpj: row.Cpf || row.Cnpj || null,
        endereco: `${row.Endereco || ''}${row.Bairro ? ', ' + row.Bairro : ''}${row.Cidade ? ', ' + row.Cidade : ''}${row.Cep ? ', ' + row.Cep : ''}`.trim(),
        email: null,
        telefone: null,
        user_id: userId, // Usa o user_id autenticado
      };

      if (!clientesMap.has(cliente.nome)) {
        const { data: insertedCliente, error } = await supabase
          .from('clientes')
          .insert([cliente])
          .select('id')
          .single();

        if (error) throw new Error(`Erro ao inserir cliente: ${error.message}`);
        clientesMap.set(cliente.nome, insertedCliente.id);
      }
    }

    // Insere processos
    for (const row of data) {
      if (row.NumeroProcesso && row.TipoProcesso) {
        const cliente_id = clientesMap.get(row.NomeCliente);
        if (cliente_id) {
          const processo = {
            numero_processo: row.NumeroProcesso,
            tipo_processo: row.TipoProcesso,
            cliente_id: cliente_id,
            user_id: userId, // Usa o user_id autenticado
          };

          const { error } = await supabase
            .from('processos')
            .insert([processo]);

          if (error) throw new Error(`Erro ao inserir processo: ${error.message}`);
        }
      }
    }

    console.log('Dados importados com sucesso');
  } catch (err) {
    console.error('Erro ao importar dados:', err.message);
  }
}

importarDados();