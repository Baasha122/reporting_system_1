export type UserRole = 'employee' | 'hod';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
