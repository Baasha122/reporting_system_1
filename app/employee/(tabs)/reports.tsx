import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportCard } from '@/components/reports/report-card';
import { Brand } from '@/constants/brand';
import { fetchReports } from '@/services/reports-api';
import { DailyReport, ReportStatus } from '@/types/report';
import { ApiError } from '@/services/api';

const FILTERS: { label: string; value?: ReportStatus }[] = [
  { label: 'All' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function EmployeeReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<ReportStatus | undefined>();

  const loadReports = useCallback(async (status?: ReportStatus) => {
    try {
      setError('');
      const data = await fetchReports(status ? { status } : undefined);
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
      loadReports(activeFilter);
    }, [activeFilter, loadReports]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports(activeFilter);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Reports</Text>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/employee/report-form')}>
          <Ionicons name="add" size={22} color={Brand.colors.white} />
          <Text style={styles.fabText}>New</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.value;
          return (
            <Pressable
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.value)}>
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Brand.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadReports(activeFilter)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-outline" size={48} color={Brand.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>Create your first daily report to get started.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => router.push(`/employee/report/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fabText: {
    color: Brand.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Brand.colors.card,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Brand.colors.primary,
    borderColor: Brand.colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Brand.colors.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
    gap: 10,
  },
  errorText: {
    color: Brand.colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 8,
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
    textAlign: 'center',
  },
});
