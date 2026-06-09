import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';

import { Brand } from '@/constants/brand';
import { supabase } from '@/lib/supabase';

export default function MonthlyScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalReports: 0,
    approvedReports: 0,
    uniqueEmployees: 0,
  });

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      // Fetching all reports for the current month.
      // In a real app, use date filters.
      const { data, error } = await supabase
        .from('daily_reports')
        .select('hours_worked, status, employee_id');

      if (error) throw error;

      if (data) {
        const totalHours = data.reduce((acc, curr) => acc + Number(curr.hours_worked || 0), 0);
        const totalReports = data.length;
        const approvedReports = data.filter(d => d.status === 'approved').length;
        const uniqueEmployees = new Set(data.map(d => d.employee_id)).size;

        setStats({ totalHours, totalReports, approvedReports, uniqueEmployees });
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Monthly Analytics</Text>
      
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Work Hours</Text>
          <Text style={styles.cardValue}>{stats.totalHours}</Text>
          <Text style={styles.cardSub}>Across all departments</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reports Submitted</Text>
          <Text style={styles.cardValue}>{stats.totalReports}</Text>
          <Text style={styles.cardSub}>This month</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Approved Reports</Text>
          <Text style={styles.cardValue}>{stats.approvedReports}</Text>
          <Text style={styles.cardSub}>{stats.totalReports > 0 ? Math.round((stats.approvedReports / stats.totalReports) * 100) : 0}% approval rate</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Employees</Text>
          <Text style={styles.cardValue}>{stats.uniqueEmployees}</Text>
          <Text style={styles.cardSub}>Logged work this month</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Department Breakdown</Text>
        <Text style={styles.emptyText}>Detailed breakdown will appear here once sufficient data is collected.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.colors.text, marginBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    minWidth: '45%',
    flex: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Brand.colors.textSecondary, marginBottom: 12 },
  cardValue: { fontSize: 32, fontWeight: '700', color: Brand.colors.primary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Brand.colors.textSecondary },
  chartCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    minHeight: 300,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Brand.colors.text, marginBottom: 16 },
  emptyText: { color: Brand.colors.textSecondary, textAlign: 'center', marginTop: 100 },
});
