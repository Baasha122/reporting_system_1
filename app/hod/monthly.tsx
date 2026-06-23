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
  const [breakdown, setBreakdown] = useState<{ department: string; hours: number; reports: number }[]>([]);
  const [maxHoursVal, setMaxHoursVal] = useState(0);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const parseHours = (durationStr: any): number => {
    if (!durationStr) return 0;
    if (typeof durationStr === 'number') return durationStr;
    const str = String(durationStr).trim();
    if (str.includes(':')) {
      const parts = str.split(':');
      const hrs = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      return hrs + (mins / 60);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const loadMonthlyData = async () => {
    try {
      setLoading(true);

      // Fetch profiles to get department mapping
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, department');
      
      if (profileErr) throw profileErr;

      // Fetch daily_reports (live drafts and recent reports)
      const { data: reports, error: reportsErr } = await supabase
        .from('daily_reports')
        .select('hours_worked, status, employee_id');

      if (reportsErr) throw reportsErr;

      // Fetch project rows (synchronized reports)
      const { data: projects, error: projectsErr } = await supabase
        .from('project')
        .select('Department, duration');

      if (projectsErr) throw projectsErr;

      // Calculate Card stats based on daily_reports
      if (reports) {
        const totalHours = reports.reduce((acc, curr) => acc + Number(curr.hours_worked || 0), 0);
        const totalReports = reports.length;
        const approvedReports = reports.filter(d => d.status === 'approved').length;
        const uniqueEmployees = new Set(reports.map(d => d.employee_id)).size;

        setStats({ totalHours, totalReports, approvedReports, uniqueEmployees });
      }

      // Group and calculate Department Breakdown
      const deptMap: Record<string, { hours: number, count: number }> = {};
      let maxHours = 0;

      // Group daily_reports
      if (reports && profiles) {
        reports.forEach(r => {
          const profile = profiles.find(p => p.id === r.employee_id);
          const dept = (profile?.department || 'Other').trim();
          const hrs = Number(r.hours_worked || 0);
          
          if (!deptMap[dept]) {
            deptMap[dept] = { hours: 0, count: 0 };
          }
          deptMap[dept].hours += hrs;
          deptMap[dept].count += 1;
        });
      }

      // Group project rows
      if (projects) {
        projects.forEach(p => {
          const dept = (p.Department || 'Other').trim();
          const hrs = parseHours(p.duration);
          
          if (!deptMap[dept]) {
            deptMap[dept] = { hours: 0, count: 0 };
          }
          deptMap[dept].hours += hrs;
          deptMap[dept].count += 1;
        });
      }

      // Build array
      const breakdownData = Object.entries(deptMap).map(([name, val]) => {
        if (val.hours > maxHours) maxHours = val.hours;
        return {
          department: name,
          hours: parseFloat(val.hours.toFixed(1)),
          reports: val.count,
        };
      }).sort((a, b) => b.hours - a.hours);

      setBreakdown(breakdownData);
      setMaxHoursVal(maxHours);

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
        {breakdown.length === 0 ? (
          <Text style={styles.emptyText}>Detailed breakdown will appear here once sufficient data is collected.</Text>
        ) : (
          breakdown.map((item, index) => (
            <View key={item.department || index} style={styles.breakdownRow}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownDeptName}>{item.department}</Text>
                <Text style={styles.breakdownMeta}>{item.hours} hrs · {item.reports} reports</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${maxHoursVal > 0 ? (item.hours / maxHoursVal) * 100 : 0}%` }]} />
              </View>
            </View>
          ))
        )}
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
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    flex: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Brand.colors.textSecondary, marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: '700', color: Brand.colors.primary, marginBottom: 4 },
  cardSub: { fontSize: 11, color: Brand.colors.textSecondary },
  chartCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    minHeight: 300,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Brand.colors.text, marginBottom: 20 },
  emptyText: { color: Brand.colors.textSecondary, textAlign: 'center', marginTop: 100 },
  breakdownRow: {
    marginBottom: 20,
  },
  breakdownInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownDeptName: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  breakdownMeta: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Brand.colors.primary,
    borderRadius: 4,
  },
});
