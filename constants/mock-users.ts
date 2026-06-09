import { User } from '@/types/auth';

export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@barani.in',
    password: 'employee123',
    role: 'employee',
    department: 'Production',
    designation: 'Production Engineer',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Priya Sharma',
    email: 'priya.sharma@barani.in',
    password: 'employee123',
    role: 'employee',
    department: 'Quality Assurance',
    designation: 'QA Inspector',
  },
  {
    id: '3',
    employeeId: 'HOD001',
    name: 'Dr. Venkatesh Murthy',
    email: 'venkatesh.murthy@barani.in',
    password: 'hod123',
    role: 'hod',
    department: 'Production',
    designation: 'Head of Department',
  },
];
