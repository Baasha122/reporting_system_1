import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import { Brand } from '@/constants/brand';
import { fetchReports } from '@/services/reports-api';
import { DailyReport, ReportStatus } from '@/types/report';

export default function ReportsScreen() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports(filter !== 'all' ? { status: filter } : undefined);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'approved': return Brand.colors.success;
      case 'rejected': return Brand.colors.error;
      case 'submitted': return Brand.colors.warning;
      default: return Brand.colors.textSecondary;
    }
  };

  const renderFilter = (status: ReportStatus | 'all', label: string) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === status && styles.filterChipActive]}
      onPress={() => setFilter(status)}
    >
      <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Reports</Text>
        <View style={styles.filters}>
          {renderFilter('all', 'All')}
          {renderFilter('submitted', 'Pending Review')}
          {renderFilter('approved', 'Approved')}
          {renderFilter('rejected', 'Rejected')}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : (
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col, { flex: 2 }]}>Employee</Text>
            <Text style={[styles.col, { flex: 2 }]}>Task</Text>
            <Text style={[styles.col, { flex: 1 }]}>Date</Text>
            <Text style={[styles.col, { flex: 1, textAlign: 'center' }]}>Hours</Text>
            <Text style={[styles.col, { flex: 1, textAlign: 'right' }]}>Status</Text>
          </View>
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No reports found.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.empName}>{item.employee?.name || 'Unknown'}</Text>
                  <Text style={styles.empDept}>{item.employee?.department || ''}</Text>
                </View>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
                  {item.task_name}
                </Text>
                <Text style={[styles.cell, { flex: 1 }]}>{item.report_date}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>{item.hours_worked}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.colors.text, marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 12 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  filterChipActive: {
    backgroundColor: Brand.colors.primary,
    borderColor: Brand.colors.primary,
  },
  filterText: { fontSize: 13, fontWeight: '500', color: Brand.colors.textSecondary },
  filterTextActive: { color: '#FFF' },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Brand.colors.border,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  col: { fontSize: 13, fontWeight: '600', color: Brand.colors.textSecondary },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  cell: { fontSize: 14, color: Brand.colors.text },
  empName: { fontWeight: '500', color: Brand.colors.text },
  empDept: { fontSize: 12, color: Brand.colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: Brand.colors.textSecondary, padding: 40 },
});
