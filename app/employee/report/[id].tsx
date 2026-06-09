import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { StatusBadge } from '@/components/reports/status-badge';
import { Brand } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { fetchReport, submitReport } from '@/services/reports-api';
import { DailyReport } from '@/types/report';
import { formatReportDate } from '@/utils/report-status';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const data = await fetchReport(Number(id));
      setReport(data);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to load report');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReport();
    }, [loadReport]),
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReport(Number(id));
      await loadReport();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !report) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Brand.colors.primary} />
      </View>
    );
  }

  const canEdit = report.status === 'draft' || report.status === 'modification_requested';
  const canSubmit = canEdit;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Brand.colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Report Details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.taskName}>{report.task_name}</Text>
          <StatusBadge status={report.status} />
          <Text style={styles.date}>{formatReportDate(report.report_date)}</Text>
        </View>

        <DetailRow label="Work Description" value={report.work_description} />
        <DetailRow label="Hours Worked" value={`${report.hours_worked} hours`} />
        <DetailRow label="Completion" value={`${report.completion_percentage}%`} />
        {report.challenges_faced ? (
          <DetailRow label="Challenges" value={report.challenges_faced} />
        ) : null}
        {report.evidence_url ? <DetailRow label="Evidence" value={report.evidence_url} /> : null}
        {report.hod_comment ? <DetailRow label="HOD Comment" value={report.hod_comment} /> : null}
      </ScrollView>

      {(canEdit || canSubmit) && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          {canEdit ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                router.push({ pathname: '/employee/report-form', params: { id: String(report.id) } })
              }>
              <Text style={styles.secondaryText}>Edit</Text>
            </Pressable>
          ) : null}
          {canSubmit ? (
            <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={Brand.colors.white} />
              ) : (
                <Text style={styles.primaryText}>Submit for Verification</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  spacer: {
    width: 24,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  headerCard: {
    backgroundColor: Brand.colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    gap: 8,
  },
  taskName: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  date: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
  },
  detailRow: {
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  detailLabel: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: Brand.colors.text,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.colors.border,
    backgroundColor: Brand.colors.card,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.colors.primary,
    alignItems: 'center',
  },
  secondaryText: {
    color: Brand.colors.primary,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Brand.colors.primary,
    alignItems: 'center',
  },
  primaryText: {
    color: Brand.colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
