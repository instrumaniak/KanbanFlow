import { createContext } from 'react';

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (data: { email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
