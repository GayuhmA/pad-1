export interface LoginRequest {
  username: string;
  password: string;
}


export interface User {
  id: number;
  username: string;
  nama: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: User;
}


export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiError {
  message: string;
}
