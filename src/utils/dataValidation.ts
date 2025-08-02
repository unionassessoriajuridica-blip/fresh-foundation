// Utility functions for data validation and cleaning

export const cleanString = (value: any): string | null => {
  if (!value) return null;
  const cleaned = value.toString().trim();
  return cleaned === '' ? null : cleaned;
};

export const cleanPhone = (value: any): string | null => {
  if (!value) return null;
  const phone = value.toString().replace(/[^\d]/g, '');
  return phone.length >= 10 ? phone : null;
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCpfCnpj = (value: string): boolean => {
  if (!value) return true; // CPF/CNPJ is optional
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
};

export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export interface ValidationError {
  line: number;
  field: string;
  value: any;
  message: string;
}

export interface ProcessedRow {
  line: number;
  data: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf_cnpj?: string;
    endereco?: string;
  };
  errors: ValidationError[];
}

export const processExcelRow = (row: any, index: number): ProcessedRow => {
  const lineNum = index + 2; // +2 because line 1 is header and index starts at 0
  const errors: ValidationError[] = [];
  
  // Extract and clean data
  const nome = cleanString(row['Nome'] || row['nome']);
  const email = cleanString(row['Email'] || row['email']);
  const telefone = cleanPhone(row['Telefone'] || row['telefone']);
  const cpf_cnpj = cleanString(row['CPF/CNPJ'] || row['cpf_cnpj']);
  const endereco = cleanString(row['Endereço'] || row['endereco'] || row['Endereco']);

  // Validate required fields
  if (!nome) {
    errors.push({
      line: lineNum,
      field: 'nome',
      value: row['Nome'] || row['nome'],
      message: 'Nome é obrigatório'
    });
  }

  // Validate email format
  if (email && !validateEmail(email)) {
    errors.push({
      line: lineNum,
      field: 'email',
      value: email,
      message: 'Email em formato inválido'
    });
  }

  // Validate CPF/CNPJ format
  if (cpf_cnpj && !validateCpfCnpj(cpf_cnpj)) {
    errors.push({
      line: lineNum,
      field: 'cpf_cnpj',
      value: cpf_cnpj,
      message: 'CPF/CNPJ deve ter 11 ou 14 dígitos'
    });
  }

  return {
    line: lineNum,
    data: {
      nome: nome ? formatName(nome) : '',
      email: email || undefined,
      telefone: telefone || undefined,
      cpf_cnpj: cpf_cnpj || undefined,
      endereco: endereco || undefined,
    },
    errors
  };
};