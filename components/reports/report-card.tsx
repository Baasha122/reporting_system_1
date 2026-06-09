import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { DailyReport } from '@/types/report';
import { formatReportDate } from '@/utils/report-status';

import { StatusBadge } from './status-badge';

interface ReportCardProps {
  report: DailyReport;
  onPress: () => void;
  showEmployee?: boolean;
}

export function ReportCard({ report, onPress, showEmployee = false }: ReportCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="document-text-outline" size={18} color={Brand.colors.primary} />
          <Text style={styles.taskName} numberOfLines={1}>
            {report.task_name}
          </Text>
        </View>
        <StatusBadge status={report.status} />
      </View>
      <Text style={styles.date}>{formatReportDate(report.report_date)}</Text>
      {showEmployee ? <Text style={styles.employee}>{report.employee.name}</Text> : null}
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{report.hours_worked}h worked</Text>
        <Text style={styles.meta}>{report.completion_percentage}% complete</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
  employee: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  meta: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
});
