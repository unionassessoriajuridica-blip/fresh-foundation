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
  
  console.log(`Processando linha ${lineNum}:`, row);
  
  // Try multiple possible column names (more flexible)
  const possibleNameFields = ['Nome', 'nome', 'NOME', 'Name', 'name', 'NAME'];
  const possibleEmailFields = ['Email', 'email', 'EMAIL', 'E-mail', 'e-mail'];
  const possiblePhoneFields = ['Telefone', 'telefone', 'TELEFONE', 'Phone', 'phone', 'Celular', 'celular'];
  const possibleCpfFields = ['CPF/CNPJ', 'cpf_cnpj', 'CPF', 'cpf', 'CNPJ', 'cnpj', 'Documento', 'documento'];
  const possibleAddressFields = ['Endereço', 'endereco', 'Endereco', 'ENDERECO', 'Address', 'address'];
  
  // Extract data with flexible field matching
  let nome = null;
  let email = null;
  let telefone = null;
  let cpf_cnpj = null;
  let endereco = null;
  
  // Find name field
  for (const field of possibleNameFields) {
    if (row[field]) {
      nome = cleanString(row[field]);
      break;
    }
  }
  
  // Find email field
  for (const field of possibleEmailFields) {
    if (row[field]) {
      email = cleanString(row[field]);
      break;
    }
  }
  
  // Find phone field
  for (const field of possiblePhoneFields) {
    if (row[field]) {
      telefone = cleanPhone(row[field]);
      break;
    }
  }
  
  // Find CPF/CNPJ field
  for (const field of possibleCpfFields) {
    if (row[field]) {
      cpf_cnpj = cleanString(row[field]);
      break;
    }
  }
  
  // Find address field
  for (const field of possibleAddressFields) {
    if (row[field]) {
      endereco = cleanString(row[field]);
      break;
    }
  }
  
  console.log(`Dados extraídos linha ${lineNum}:`, { nome, email, telefone, cpf_cnpj, endereco });

  // Validate required fields - only name is truly required
  if (!nome) {
    console.log(`Erro linha ${lineNum}: Nome vazio`);
    errors.push({
      line: lineNum,
      field: 'nome',
      value: 'vazio',
      message: 'Nome é obrigatório'
    });
  }

  // Validate email format (only if provided)
  if (email && !validateEmail(email)) {
    console.log(`Erro linha ${lineNum}: Email inválido:`, email);
    errors.push({
      line: lineNum,
      field: 'email',
      value: email,
      message: 'Email em formato inválido'
    });
  }

  // Validate CPF/CNPJ format (only if provided)
  if (cpf_cnpj && !validateCpfCnpj(cpf_cnpj)) {
    console.log(`Erro linha ${lineNum}: CPF/CNPJ inválido:`, cpf_cnpj);
    errors.push({
      line: lineNum,
      field: 'cpf_cnpj',
      value: cpf_cnpj,
      message: 'CPF/CNPJ deve ter 11 ou 14 dígitos'
    });
  }

  const result = {
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
  
  console.log(`Resultado linha ${lineNum}:`, result);
  return result;
};