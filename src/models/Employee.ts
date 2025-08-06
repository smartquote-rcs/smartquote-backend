export interface Employee{
  name: string;
  email: string;
  password: string;
  position: string;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  position: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}