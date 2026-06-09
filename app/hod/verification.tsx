import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportCard } from '@/components/reports/report-card';
import { Brand } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { fetchReports, verifyReport } from '@/services/reports-api';
import { DailyReport, ReportStatus } from '@/types/report';

export default function HodVerificationScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [comment, setComment] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setError('');
      const data = await fetchReports({ status: 'submitted' });
      setReports(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReports();
    }, [loadReports]),
  );

  const handleVerify = async (status: ReportStatus) => {
    if (!selectedReport) return;
    setVerifying(true);
    try {
      await verifyReport(selectedReport.id, status, comment.trim() || undefined);
      setSelectedReport(null);
      setComment('');
      await loadReports();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Report Verification</Text>
      <Text style={styles.subtitle}>Review and approve employee daily reports</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Brand.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Brand.colors.success} />
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyText}>No pending reports to verify.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportCard report={item} showEmployee onPress={() => setSelectedReport(item)} />
          )}
        />
      )}

      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedReport?.task_name}</Text>
            <Text style={styles.modalMeta}>
              {selectedReport?.employee.name} · {selectedReport?.hours_worked}h ·{' '}
              {selectedReport?.completion_percentage}%
            </Text>
            <Text style={styles.modalDescription}>{selectedReport?.work_description}</Text>

            <Text style={styles.commentLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add feedback for the employee..."
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.rejectBtn} disabled={verifying} onPress={() => handleVerify('rejected')}>
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
              <Pressable
                style={styles.modifyBtn}
                disabled={verifying}
                onPress={() => handleVerify('modification_requested')}>
                <Text style={styles.modifyText}>Request Changes</Text>
              </Pressable>
              <Pressable style={styles.approveBtn} disabled={verifying} onPress={() => handleVerify('approved')}>
                {verifying ? (
                  <ActivityIndicator color={Brand.colors.white} />
                ) : (
                  <Text style={styles.approveText}>Approve</Text>
                )}
              </Pressable>
            </View>

            <Pressable style={styles.closeBtn} onPress={() => setSelectedReport(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 10,
  },
  errorText: {
    color: Brand.colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Brand.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Brand.colors.white,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Brand.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  modalMeta: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.colors.textSecondary,
  },
  modalDescription: {
    marginTop: 12,
    fontSize: 14,
    color: Brand.colors.text,
    lineHeight: 22,
  },
  commentLabel: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  commentInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Brand.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  rejectText: {
    color: Brand.colors.error,
    fontWeight: '700',
    fontSize: 12,
  },
  modifyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
  },
  modifyText: {
    color: Brand.colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Brand.colors.success,
    alignItems: 'center',
  },
  approveText: {
    color: Brand.colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeText: {
    color: Brand.colors.textSecondary,
    fontWeight: '600',
  },
});
