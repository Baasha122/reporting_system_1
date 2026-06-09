import { Brand } from '@/constants/brand';
import { ReportStatus } from '@/types/report';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  modification_requested: 'Needs Changes',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: Brand.colors.textSecondary,
  submitted: Brand.colors.warning,
  approved: Brand.colors.success,
  rejected: Brand.colors.error,
  modification_requested: Brand.colors.accent,
};

export function formatReportDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}
