import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processExcelRow, ValidationError } from '@/utils/dataValidation';

interface ClienteData {
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: string;
}

interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  duplicatesSkipped: number;
  errors: ValidationError[];
}

export const useClienteExcel = () => {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const downloadClientesExcel = async () => {
    console.log('Iniciando download dos clientes');
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

  const uploadClientesExcel = async (file: File): Promise<ImportResult | null> => {
    console.log('Iniciando upload do Excel:', file.name);
    setImporting(true);
    setProgress(0);
    
    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        throw new Error('Arquivo Excel está vazio');
      }

      setProgress(10);

      // Process and validate all rows
      const processedRows = jsonData.map((row, index) => processExcelRow(row, index));
      const validRows = processedRows.filter(row => row.errors.length === 0);
      const invalidRows = processedRows.filter(row => row.errors.length > 0);
      
      setProgress(30);

      if (validRows.length === 0) {
        const allErrors = processedRows.flatMap(row => row.errors);
        await generateErrorReport(allErrors, file.name);
        
        toast({
          title: 'Nenhum registro válido',
          description: `Todas as ${jsonData.length} linhas contêm erros. Relatório de erros gerado.`,
          variant: 'destructive',
        });
        return {
          totalRows: jsonData.length,
          validRows: 0,
          invalidRows: jsonData.length,
          importedRows: 0,
          duplicatesSkipped: 0,
          errors: allErrors
        };
      }

      // Get current user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      setProgress(50);

      // Check for duplicates
      const existingClientes = await supabase
        .from('clientes')
        .select('email, cpf_cnpj')
        .eq('user_id', user.user.id);

      const existingEmails = new Set(existingClientes.data?.map(c => c.email).filter(Boolean));
      const existingCpfCnpj = new Set(existingClientes.data?.map(c => c.cpf_cnpj).filter(Boolean));

      const clientesToInsert = validRows.filter(row => {
        const { email, cpf_cnpj } = row.data;
        if (email && existingEmails.has(email)) return false;
        if (cpf_cnpj && existingCpfCnpj.has(cpf_cnpj)) return false;
        return true;
      });

      const duplicatesSkipped = validRows.length - clientesToInsert.length;
      
      setProgress(70);

      // Insert valid clients in batches
      let importedCount = 0;
      if (clientesToInsert.length > 0) {
        const clientesComUserId = clientesToInsert.map(row => ({
          ...row.data,
          user_id: user.user.id
        }));

        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < clientesComUserId.length; i += batchSize) {
          const batch = clientesComUserId.slice(i, i + batchSize);
          const { error } = await supabase
            .from('clientes')
            .insert(batch);

          if (error) {
            console.error('Error inserting batch:', error);
            // Continue with next batch instead of failing completely
          } else {
            importedCount += batch.length;
          }
          
          setProgress(70 + (i / clientesComUserId.length) * 25);
        }
      }

      setProgress(95);

      // Generate error report if there are errors
      const allErrors = processedRows.flatMap(row => row.errors);
      if (allErrors.length > 0) {
        await generateErrorReport(allErrors, file.name);
      }

      setProgress(100);

      const result: ImportResult = {
        totalRows: jsonData.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        importedRows: importedCount,
        duplicatesSkipped,
        errors: allErrors
      };

      // Show result toast
      if (importedCount > 0) {
        toast({
          title: 'Importação concluída',
          description: `${importedCount} cliente(s) importado(s) com sucesso${duplicatesSkipped > 0 ? `. ${duplicatesSkipped} duplicata(s) ignorada(s)` : ''}${allErrors.length > 0 ? `. ${allErrors.length} erro(s) encontrado(s)` : ''}`,
        });
      } else {
        toast({
          title: 'Nenhum cliente importado',
          description: 'Todos os registros eram duplicatas ou continham erros',
          variant: 'destructive',
        });
      }

      return result;

    } catch (error: any) {
      console.error('Error uploading Excel:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Falha ao processar arquivo Excel',
        variant: 'destructive',
      });
      return null;
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const generateErrorReport = async (errors: ValidationError[], originalFileName: string) => {
    if (errors.length === 0) return;

    const errorData = errors.map(error => ({
      'Linha': error.line,
      'Campo': error.field,
      'Valor': error.value || '',
      'Erro': error.message
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    
    const columnWidths = [
      { wch: 8 },  // Linha
      { wch: 15 }, // Campo
      { wch: 25 }, // Valor
      { wch: 40 }, // Erro
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erros');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const fileName = `erros_${originalFileName.replace('.xlsx', '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
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
    importing,
    progress,
    downloadClientesExcel,
    uploadClientesExcel,
    downloadTemplateExcel,
    generateErrorReport
  };
};