import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';

export default function EmployeeManagementScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const loadPendingEmployees = useCallback(async () => {
    if (!user?.department) return;
    
    try {
      setError('');
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', user.department)
        .eq('status', activeTab)
        .eq('role', 'employee');

      if (fetchError) throw fetchError;

      const formattedEmployees = (data || []).map(d => ({
        id: d.id,
        employeeId: d.employee_id,
        name: d.name,
        email: d.email,
        role: d.role,
        department: d.department,
        designation: d.designation,
        status: d.status,
      }));

      setEmployees(formattedEmployees);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending employees');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.department]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPendingEmployees();
    }, [loadPendingEmployees, activeTab])
  );

  const handleUpdateStatus = async (employeeId: string, status: 'approved' | 'rejected') => {
    setProcessingId(employeeId);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', employeeId);

      if (updateError) throw updateError;
      
      // Remove from the list immediately upon success
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    } catch (err: any) {
      Alert.alert('Error', err.message || `Failed to ${status} employee`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Employee Management</Text>
      <Text style={styles.subtitle}>Review and manage employees for {user?.department}</Text>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending Approvals</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>Approved</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Brand.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPendingEmployees}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPendingEmployees(); }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Brand.colors.success} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending' ? 'All caught up' : 'No employees'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'pending' ? 'No pending employee registrations.' : 'No approved employees found.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.empId}>{item.employeeId}</Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{item.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: item.status === 'pending' ? Brand.colors.warning : Brand.colors.primary }]}>
                    {item.status || 'NULL'}
                  </Text>
                </View>
              </View>

              {activeTab === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtn, processingId === item.id && styles.disabledBtn]} 
                    disabled={processingId === item.id}
                    onPress={() => handleUpdateStatus(item.id, 'rejected')}
                  >
                    <Ionicons name="close" size={16} color={Brand.colors.error} style={{ marginRight: 4 }} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn, processingId === item.id && styles.disabledBtn]} 
                    disabled={processingId === item.id}
                    onPress={() => handleUpdateStatus(item.id, 'approved')}
                  >
                    {processingId === item.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.approveText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Brand.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.colors.textSecondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  list: {
    paddingBottom: 24,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 10,
    marginTop: 60,
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
    color: '#FFF',
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  empId: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 20,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectText: {
    color: Brand.colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: Brand.colors.success,
  },
  approveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
