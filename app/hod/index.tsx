import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Platform, Alert, SafeAreaView } from 'react-native';
import * as XLSX from 'xlsx';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { CustomPicker } from '@/components/ui/custom-picker';

export default function HodDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  

  
  // Department Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    reportsSubmitted: 0,
    pendingReports: 0,
    completedReports: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Employee Search
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedEmployee, setSearchedEmployee] = useState<any>(null);
  const [employeeReports, setEmployeeReports] = useState<any[]>([]);
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartmentStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle incoming search requests from the search screen
  useEffect(() => {
    if (params.searchEmployeeId && departmentEmployees.length > 0) {
      const incomingId = params.searchEmployeeId as string;
      setSearchId(incomingId);
      handleSearch(incomingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.searchEmployeeId, departmentEmployees]);

  const fetchDepartmentStats = async () => {
    if (!user?.department) return;
    try {
      setLoadingStats(true);
      // 1. Total employees in department
      const { count: empCount, data: emps } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('department', user.department)
        .eq('role', 'employee')
        .order('name');
        
      if (emps) {
        setDepartmentEmployees(emps);
      }

      // 2. Fetch all reports for these employees to aggregate
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*, profiles!inner(department)')
        .eq('profiles.department', user.department);

      let submitted = 0;
      let pending = 0;
      let completed = 0;
      
      if (reports) {
        submitted = reports.length;
        completed = reports.filter(r => r.status === 'approved').length;
        pending = reports.filter(r => r.status === 'submitted').length;
      }

      setStats({
        totalEmployees: empCount || 0,
        reportsSubmitted: submitted,
        pendingReports: pending,
        completedReports: completed,
      });
    } catch (err) {
      console.error("Failed to fetch department stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = async (overrideId?: string) => {
    const idToSearch = typeof overrideId === 'string' ? overrideId : searchId;
    if (!idToSearch.trim() || !user?.department) return;
    setIsSearching(true);
    try {
      // Find employee
      const { data: emp, error: empErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('employee_id', idToSearch.trim().toUpperCase())
        .eq('department', user.department)
        .single();
        
      if (empErr || !emp) {
        alert('Employee not found in your department');
        setSearchedEmployee(null);
        setEmployeeReports([]);
        return;
      }
      
      setSearchedEmployee(emp);
      
      // Fetch their reports
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('employee_id', emp.id)
        .order('report_date', { ascending: false });
        
      setEmployeeReports(reports || []);
    } catch(err: any) {
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Summary calculations for searched employee
  const searchedSubmitted = employeeReports.length;
  const searchedPending = employeeReports.filter(r => r.status === 'submitted').length;
  const searchedTotalHours = employeeReports.reduce((sum, r) => sum + Number(r.hours_worked), 0);

  const getWeeklyEfficiency = () => {
    if (!employeeReports || employeeReports.length === 0) return [];
    
    // Group reports by week
    const weeks: Record<string, { taskCount: number, targetTasks: number }> = {};
    
    employeeReports.forEach(report => {
      if (!report.report_date) return;
      const date = new Date(report.report_date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { taskCount: 0, targetTasks: 30 };
      }
      weeks[weekKey].taskCount += 1;
    });
    
    return Object.keys(weeks).sort((a,b) => b.localeCompare(a)).map(key => {
      const eff = Math.round((weeks[key].taskCount / weeks[key].targetTasks) * 100);
      return {
        weekStart: key,
        efficiency: eff > 100 ? 100 : eff,
        count: weeks[key].taskCount
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return styles.statusCompleted;
      case 'rejected': return { backgroundColor: '#FEE2E2' };
      default: return styles.statusProgress;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'approved': return styles.statusCompletedText;
      case 'rejected': return { color: '#991B1B' };
      default: return styles.statusProgressText;
    }
  };

  const handleDownloadExcel = async () => {
    if (!searchedEmployee || !employeeReports || employeeReports.length === 0) {
      Alert.alert("Notice", "No reports available to download.");
      return;
    }

    try {
      const wsData = employeeReports.map((report) => ({
        Date: report.report_date || '',
        Task: report.task_name || '',
        Description: report.work_description || report.task_description || '',
        'Hours Worked': report.hours_worked || '',
        Status: report.status ? String(report.status).replace('_', ' ').toUpperCase() : 'UNKNOWN',
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
      
      const sanitizedName = searchedEmployee.name ? searchedEmployee.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Employee';
      const sanitizedMonth = currentMonthName ? currentMonthName.replace(/[^a-zA-Z0-9]/g, '_') : 'Month';
      const fileName = `${sanitizedName}_Report_${sanitizedMonth}.xlsx`;
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, fileName);
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: 'base64'
        });
        
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Employee Report',
          UTI: 'com.microsoft.excel.xls'
        });
      }
      
    } catch (error: any) {
      console.error("Error generating Excel:", error);
      Alert.alert("Error", `Failed to generate Excel file: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const handleDownloadDepartmentExcel = async () => {
    try {
      if (!user?.department) return;
      
      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select('*, profiles!inner(name, employee_id, department)')
        .eq('profiles.department', user.department)
        .order('report_date', { ascending: false });
        
      if (error) throw error;
      
      if (!reports || reports.length === 0) {
        Alert.alert("Notice", "No reports available for this department.");
        return;
      }
      
      const wsData = reports.map((report) => {
        const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
        return {
          'Employee ID': profile?.employee_id || '',
          'Employee Name': profile?.name || '',
          Date: report.report_date || '',
          Task: report.task_name || '',
          Description: report.work_description || report.task_description || '',
          'Hours Worked': report.hours_worked || '',
          Status: report.status ? String(report.status).replace('_', ' ').toUpperCase() : 'UNKNOWN',
        };
      });
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Department Report");
      
      const sanitizedDept = user.department.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedMonth = currentMonthName ? currentMonthName.replace(/[^a-zA-Z0-9]/g, '_') : 'Month';
      const fileName = `${sanitizedDept}_Overall_Report_${sanitizedMonth}.xlsx`;
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, fileName);
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: 'base64'
        });
        
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Department Report',
          UTI: 'com.microsoft.excel.xls'
        });
      }
    } catch (error: any) {
      console.error("Error generating overall Excel:", error);
      Alert.alert("Error", `Failed to generate Excel file: ${error?.message || JSON.stringify(error)}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F6F9' }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Top Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#EBF4FF' }]}>
            <Ionicons name="people-outline" size={24} color="#0056FF" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Employees</Text>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={[styles.statValue, { color: '#0056FF' }]}>{stats.totalEmployees}</Text>}
            <TouchableOpacity onPress={() => router.push('/hod/search')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="clipboard-outline" size={24} color="#2E7D32" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Reports Submitted</Text>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={[styles.statValue, { color: '#2E7D32' }]}>{stats.reportsSubmitted}</Text>}
            <TouchableOpacity onPress={() => router.push('/hod/reports')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="time-outline" size={24} color="#ED6C02" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Pending Reports</Text>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={[styles.statValue, { color: '#ED6C02' }]}>{stats.pendingReports}</Text>}
            <TouchableOpacity onPress={() => router.push('/hod/reports')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#9C27B0" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Completed Reports</Text>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={[styles.statValue, { color: '#9C27B0' }]}>{stats.completedReports}</Text>}
            <TouchableOpacity onPress={() => router.push('/hod/reports')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Employee Search */}
      <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.headerIndicator} />
          <Text style={styles.headerTitle}>EMPLOYEE SEARCH</Text>
        </View>
        <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#F0F9FF', borderColor: '#0056FF' }]} onPress={handleDownloadDepartmentExcel}>
          <Ionicons name="download-outline" size={16} color="#0056FF" />
          <Text style={styles.downloadBtnText}>Overall Report</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Employee ID</Text>
        <View style={styles.searchRow}>
          <View style={[styles.searchInput, { paddingHorizontal: 0, minHeight: 50 }]}>
            <CustomPicker
              selectedValue={searchId}
              onValueChange={(itemValue) => setSearchId(itemValue)}
              style={{ width: '100%', height: 50, minHeight: 50, margin: 0, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 8, fontSize: 15 }}
              placeholder="Select Employee"
              items={departmentEmployees.map((emp) => ({
                label: `${emp.name} (${emp.employee_id})`,
                value: emp.employee_id
              }))}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()} disabled={isSearching}>
            {isSearching ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="search" size={16} color="#FFF" />}
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.searchHint}>ⓘ Enter Employee ID to view monthly task report</Text>
      </View>


      {/* Employee Monthly Report */}
      {searchedEmployee && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.headerIndicator} />
            <Text style={styles.headerTitle}>EMPLOYEE MONTHLY REPORT</Text>
          </View>

          <View style={styles.reportRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>MONTHLY SUMMARY</Text>
              <View style={styles.monthBadge}>
                <Ionicons name="calendar-outline" size={16} color="#0056FF" />
                <Text style={styles.monthBadgeText}>{currentMonthName}</Text>
              </View>
              <View style={styles.summaryList}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}><Ionicons name="calendar-outline" size={16} color="#6B7280" /><Text style={styles.summaryLabel}>Total Working Days</Text></View>
                  <Text style={styles.summaryVal}>22</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}><Ionicons name="clipboard-outline" size={16} color="#6B7280" /><Text style={styles.summaryLabel}>Reports Submitted</Text></View>
                  <Text style={styles.summaryVal}>{searchedSubmitted}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}><Ionicons name="time-outline" size={16} color="#6B7280" /><Text style={styles.summaryLabel}>Pending Reports</Text></View>
                  <Text style={[styles.summaryVal, {color: '#ED6C02'}]}>{searchedPending}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}><Ionicons name="time-outline" size={16} color="#6B7280" /><Text style={styles.summaryLabel}>Total Hours Worked</Text></View>
                  <Text style={[styles.summaryVal, {color: '#0056FF'}]}>{searchedTotalHours}</Text>
                </View>
              </View>

              <Text style={[styles.summaryTitle, { marginTop: 24 }]}>WEEKLY EFFICIENCY</Text>
              <View style={styles.summaryList}>
                {getWeeklyEfficiency().length === 0 ? (
                   <Text style={{color: '#6B7280', fontSize: 13, marginTop: 8}}>No data for efficiency.</Text>
                ) : (
                   getWeeklyEfficiency().map((wk, idx) => (
                     <View key={idx} style={styles.summaryItem}>
                       <View style={styles.summaryIconRow}>
                         <Ionicons name="trending-up-outline" size={16} color="#0056FF" />
                         <Text style={styles.summaryLabel}>Week of {wk.weekStart}</Text>
                       </View>
                       <View style={{alignItems: 'flex-end'}}>
                         <Text style={[styles.summaryVal, {color: wk.efficiency >= 80 ? '#2E7D32' : (wk.efficiency >= 50 ? '#ED6C02' : '#991B1B')}]}>
                           {wk.efficiency}%
                         </Text>
                         <Text style={{fontSize: 10, color: '#6B7280'}}>{wk.count} tasks</Text>
                       </View>
                     </View>
                   ))
                )}
              </View>
            </View>

            <View style={styles.tableCard}>
              <View style={styles.tableHeaderSection}>
                <View>
                  <Text style={styles.metaText}><Text style={styles.metaLabel}>Employee Name</Text> : {searchedEmployee.name}</Text>
                  <Text style={styles.metaText}><Text style={styles.metaLabel}>Department</Text>    : {searchedEmployee.department}</Text>
                  <Text style={styles.metaText}><Text style={styles.metaLabel}>Month</Text>         : <Text style={{color: '#0056FF', fontWeight: '600'}}>{currentMonthName}</Text></Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadExcel}>
                  <Ionicons name="download-outline" size={16} color="#0056FF" />
                  <Text style={styles.downloadBtnText}>Download Report</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                <View style={[styles.table, { minWidth: 600 }]}>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableCol, {flex: 1}]}>Date</Text>
                    <Text style={[styles.tableCol, {flex: 2}]}>Task Description</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>Hours Worked</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>Status</Text>
                  </View>
                  {employeeReports.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#6B7280' }}>No reports found for this employee this month.</Text>
                    </View>
                  ) : (
                    employeeReports.slice(0, 5).map((row, i) => (
                      <View key={row.id || i} style={styles.tableRow}>
                        <Text style={[styles.tableCell, {flex: 1}]}>{row.report_date}</Text>
                        <Text style={[styles.tableCell, {flex: 2}]} numberOfLines={1}>{row.task_name}</Text>
                        <Text style={[styles.tableCell, {flex: 1, textAlign: 'center'}]}>{row.hours_worked}</Text>
                        <View style={{flex: 1, alignItems: 'center'}}>
                          <View style={[styles.statusChip, getStatusColor(row.status)]}>
                            <Text style={[styles.statusText, getStatusTextColor(row.status)]}>
                              {row.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                  {employeeReports.length > 5 && (
                    <TouchableOpacity style={styles.viewAllTasks} onPress={() => router.push('/hod/monthly')}>
                      <Text style={styles.viewAllTasksText}>View all tasks →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </>
      )}


      <View style={{height: 40}} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
  },
  viewAll: {
    fontSize: 12,
    color: '#0056FF',
    alignSelf: 'flex-end',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIndicator: {
    width: 4,
    height: 16,
    backgroundColor: '#0056FF',
    marginRight: 8,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.colors.primaryDark,
    letterSpacing: 0.5,
  },
  searchCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  searchBtn: {
    backgroundColor: '#0056FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 8,
  },
  searchBtnText: {
    color: '#FFF',
    fontWeight: '500',
  },
  searchHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  reportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  tableCard: {
    flex: 2,
    minWidth: 320,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeaderSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  metaText: {
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: '600',
    color: '#4B5563',
    width: 100,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0056FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  downloadBtnText: {
    color: '#0056FF',
    fontWeight: '500',
    fontSize: 13,
  },
  table: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCol: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
    color: '#1F2937',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: { backgroundColor: '#DEF7EC' },
  statusProgress: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusCompletedText: { color: '#03543F' },
  statusProgressText: { color: '#92400E' },
  viewAllTasks: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllTasksText: {
    color: '#0056FF',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 16,
    textAlign: 'center',
  },
  monthBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 24,
  },
  monthBadgeText: {
    color: '#0056FF',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryList: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

});
