import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { useLogout } from '@/components/auth/auth-guard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

const RECENT_ACTIVITY = [
  { id: '1', title: 'Hydraulic Press Assembly', status: 'In Progress', time: '2 hours ago' },
  { id: '2', title: 'Daily Report Submitted', status: 'Pending Review', time: 'Yesterday' },
  { id: '3', title: 'Quality Check - Unit #4521', status: 'Completed', time: '2 days ago' },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const handleLogout = useLogout();
  
  const [departmentProjects, setDepartmentProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (user?.department) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('department_projects')
        .select('*')
        .eq('department', user?.department)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDepartmentProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <DashboardHeader user={user} onLogout={handleLogout} badge="Employee Portal" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>
        <View style={styles.statsRow}>
          <StatCard title="Pending Tasks" value={3} icon="time-outline" color={Brand.colors.warning} />
          <StatCard title="Completed" value={5} icon="checkmark-circle-outline" color={Brand.colors.success} />
        </View>
        <View style={styles.statsRow}>
          <StatCard title="Hours Today" value="6.5h" icon="timer-outline" color={Brand.colors.primary} />
          <StatCard title="Reports Due" value={1} icon="document-outline" color={Brand.colors.accent} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <View style={styles.actionCard}>
            <Ionicons name="add-circle" size={28} color={Brand.colors.primary} />
            <Text style={styles.actionText}>New Task</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons name="create" size={28} color={Brand.colors.accent} />
            <Text style={styles.actionText}>Submit Report</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Department Projects</Text>
        {loadingProjects ? (
          <ActivityIndicator size="small" color={Brand.colors.primary} style={{ marginVertical: 20 }} />
        ) : departmentProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No projects currently active.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectsScroll}>
            {departmentProjects.map((proj) => (
              <View key={proj.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectId}>{proj.project_id}</Text>
                  <Ionicons name="briefcase-outline" size={16} color={Brand.colors.primary} />
                </View>
                <Text style={styles.projectName} numberOfLines={1}>{proj.project_name}</Text>
                <Text style={styles.customerName} numberOfLines={1}>{proj.customer_name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {RECENT_ACTIVITY.map((item) => (
          <View key={item.id} style={styles.activityCard}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityMeta}>
                {item.status} · {item.time}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Brand.colors.textSecondary} />
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Brand.colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.colors.accent,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  activityMeta: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 24,
  },
  emptyCard: {
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.colors.border,
    marginBottom: 16,
  },
  emptyText: {
    color: Brand.colors.textSecondary,
    fontSize: 13,
  },
  projectsScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  projectCard: {
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 16,
    width: 200,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Brand.colors.primary,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectId: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.colors.primary,
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.colors.text,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
});
