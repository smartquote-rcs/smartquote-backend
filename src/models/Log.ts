export interface Log {           
  type: string;  
  titulo: string;  
  assunto: string; 
  path_file: string;  
}

export interface LogsDTO {
  id?: number;              
  type: string;  
  titulo: string;  
  assunto: string; 
  path_file: string; 
  cadastrado_em: Date; 
}

