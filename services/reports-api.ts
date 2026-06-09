import { supabase } from '@/lib/supabase';
import { DailyReport, ReportFilters, ReportStatus } from '@/types/report';

export interface ReportPayload {
  report_date: string;
  task_name: string;
  work_description: string;
  hours_worked: number;
  challenges_faced?: string | null;
  completion_percentage: number;
  evidence_url?: string | null;
  status?: ReportStatus;
}

export async function fetchReports(filters?: ReportFilters): Promise<DailyReport[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  // Get current user's profile to know their role and department
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role, department')
    .eq('id', authData.user.id)
    .single();

  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      employee:profiles!inner(id, name, employee_id, department)
    `)
    .order('created_at', { ascending: false });

  // If user is an HOD, strictly filter by their department
  if (currentUserProfile?.role === 'hod' && currentUserProfile?.department) {
    query = query.eq('profiles.department', currentUserProfile.department);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte('report_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('report_date', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Reshape data to match DailyReport interface
  return (data || []).map(item => ({
    ...item,
    employee: Array.isArray(item.employee) ? item.employee[0] : item.employee
  })) as DailyReport[];
}

export async function fetchReport(id: number): Promise<DailyReport> {
  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      employee:profiles(id, name, employee_id, department)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    employee: Array.isArray(data.employee) ? data.employee[0] : data.employee
  } as DailyReport;
}

export async function createReport(payload: ReportPayload): Promise<DailyReport> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('daily_reports')
    .insert([
      {
        ...payload,
        employee_id: user.id,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data as DailyReport;
}

export async function updateReport(id: number, payload: Partial<ReportPayload>): Promise<DailyReport> {
  const { data, error } = await supabase
    .from('daily_reports')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DailyReport;
}

export async function submitReport(id: number): Promise<DailyReport> {
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DailyReport;
}

export async function verifyReport(id: number, status: ReportStatus, hodComment?: string): Promise<DailyReport> {
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status, 
      hod_comment: hodComment || null,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DailyReport;
}
