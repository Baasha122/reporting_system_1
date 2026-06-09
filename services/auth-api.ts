import { User } from '@/types/auth';

import { apiRequest, setStoredToken } from './api';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    role: User['role'];
    department: string;
    designation: string;
  };
}

function mapUser(apiUser: LoginResponse['user']): User {
  return {
    id: String(apiUser.id),
    employeeId: apiUser.employee_id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    department: apiUser.department,
    designation: apiUser.designation,
  };
}

export async function loginWithApi(identifier: string, password: string) {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ identifier, password }),
  });

  await setStoredToken(data.access_token);
  return mapUser(data.user);
}

export async function fetchCurrentUser() {
  const data = await apiRequest<LoginResponse['user']>('/auth/me');
  return mapUser(data);
}

export async function clearAuthToken() {
  await setStoredToken(null);
}
