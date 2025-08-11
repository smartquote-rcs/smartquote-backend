export interface Fornecedor {
  id?: number;
  nomeEmpresa: string;
  observacoes: string;
  ativo?: boolean;
  cadastradoEm: string; 
  cadastradoPor: number;
  atualizadoEm: string;
  atualizadoPor: number;
  categoriaMercado: string;
  contactos: any;
  rating?: number;
  localizacao: string;
}

export interface FornecedorDTO {
  id: number;
  nomeEmpresa: string;
  observacoes: string;
  ativo: boolean;
  cadastradoEm: string;
  cadastradoPor: number;
  atualizadoEm: string;
  atualizadoPor: number;
  categoriaMercado: string;
  contactos: any;
  rating: number;
  localizacao: string;
}
