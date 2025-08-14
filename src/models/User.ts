export interface User{
  name: string;
  email: string;
  contact:string;
  password: string;
  department:string;
  position: string;
}

export interface UserDTO {
  id: string;
  name: string;
  position: string;
  auth_id:string;
  created_at: string;
}