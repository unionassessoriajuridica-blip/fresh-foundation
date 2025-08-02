import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClienteData {
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: string;
}

export const useClienteExcel = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadClientesExcel = async () => {
    setLoading(true);
    try {
      // Buscar todos os clientes
      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('nome, email, telefone, cpf_cnpj, endereco, created_at')
        .order('nome');

      if (error) throw error;

      // Preparar dados para Excel
      const excelData = clientes.map(cliente => ({
        'Nome': cliente.nome,
        'Email': cliente.email || '',
        'Telefone': cliente.telefone || '',
        'CPF/CNPJ': cliente.cpf_cnpj || '',
        'Endereço': cliente.endereco || '',
        'Data Cadastro': cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : ''
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Ajustar larguras das colunas
      const columnWidths = [
        { wch: 30 }, // Nome
        { wch: 25 }, // Email
        { wch: 15 }, // Telefone
        { wch: 18 }, // CPF/CNPJ
        { wch: 40 }, // Endereço
        { wch: 12 }, // Data Cadastro
      ];
      worksheet['!cols'] = columnWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Fazer download
      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: 'Download realizado',
        description: `Arquivo ${fileName} baixado com sucesso`,
      });

    } catch (error: any) {
      console.error('Error downloading Excel:', error);
      toast({
        title: 'Erro no download',
        description: error.message || 'Falha ao gerar arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadClientesExcel = async (file: File) => {
    setLoading(true);
    try {
      // Ler arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        throw new Error('Arquivo Excel está vazio');
      }

      // Validar e processar dados
      const clientesParaInserir: ClienteData[] = [];
      const erros: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const linhaNum = index + 2; // +2 porque linha 1 é cabeçalho e index começa em 0

        // Validar nome obrigatório
        if (!row['Nome'] && !row['nome']) {
          erros.push(`Linha ${linhaNum}: Nome é obrigatório`);
          return;
        }

        const cliente: ClienteData = {
          nome: (row['Nome'] || row['nome'])?.toString().trim(),
          email: (row['Email'] || row['email'])?.toString().trim() || null,
          telefone: (row['Telefone'] || row['telefone'])?.toString().trim() || null,
          cpf_cnpj: (row['CPF/CNPJ'] || row['cpf_cnpj'])?.toString().trim() || null,
          endereco: (row['Endereço'] || row['endereco'] || row['Endereco'])?.toString().trim() || null,
        };

        // Validação básica de email
        if (cliente.email && !cliente.email.includes('@')) {
          erros.push(`Linha ${linhaNum}: Email inválido`);
          return;
        }

        clientesParaInserir.push(cliente);
      });

      if (erros.length > 0) {
        toast({
          title: 'Erros na validação',
          description: `${erros.length} erro(s) encontrado(s). Primeiro erro: ${erros[0]}`,
          variant: 'destructive',
        });
        return;
      }

      // Inserir clientes no banco
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const clientesComUserId = clientesParaInserir.map(cliente => ({
        ...cliente,
        user_id: user.user.id
      }));

      const { error } = await supabase
        .from('clientes')
        .insert(clientesComUserId);

      if (error) throw error;

      toast({
        title: 'Upload realizado',
        description: `${clientesParaInserir.length} cliente(s) importado(s) com sucesso`,
      });

      return true;

    } catch (error: any) {
      console.error('Error uploading Excel:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Falha ao processar arquivo Excel',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplateExcel = () => {
    // Criar template vazio
    const templateData = [
      {
        'Nome': 'João Silva',
        'Email': 'joao@exemplo.com',
        'Telefone': '(11) 99999-9999',
        'CPF/CNPJ': '123.456.789-00',
        'Endereço': 'Rua das Flores, 123 - São Paulo/SP'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar larguras das colunas
    const columnWidths = [
      { wch: 30 }, // Nome
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 18 }, // CPF/CNPJ
      { wch: 40 }, // Endereço
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    saveAs(blob, 'template_clientes.xlsx');

    toast({
      title: 'Template baixado',
      description: 'Arquivo template_clientes.xlsx baixado com sucesso',
    });
  };

  return {
    loading,
    downloadClientesExcel,
    uploadClientesExcel,
    downloadTemplateExcel
  };
};