import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, SafeAreaView } from 'react-native';
import * as XLSX from 'xlsx-js-style';

import { Brand } from '@/constants/brand';
import { fetchReports } from '@/services/reports-api';
import { DailyReport, ReportStatus } from '@/types/report';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

export default function ReportsScreen() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<{ employee: any, reports: DailyReport[] } | null>(null);
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch all employees in this department
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('department').eq('id', authData.user.id).single();
        const dept = profile?.department || authData.user.user_metadata?.department;
        if (dept) {
          const { data: emps } = await supabase.from('profiles').select('*').eq('department', dept).eq('role', 'employee');
          setDepartmentEmployees(emps || []);
        }
      }

      // 2. Fetch the reports
      let fetchParams: any = undefined;
      const today = new Date();
      if (filter === 'weekly') {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        fetchParams = { dateFrom: lastWeek.toISOString().split('T')[0] };
      } else if (filter === 'monthly') {
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        fetchParams = { dateFrom: lastMonth.toISOString().split('T')[0] };
      }
      const data = await fetchReports(fetchParams);
      setReports(data || []);
      setSelectedEmployees(new Set());
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

  const renderFilter = (status: string, label: string) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === status && styles.filterChipActive]}
      onPress={() => setFilter(status)}
    >
      <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const toggleSelection = (empId: string) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(empId)) {
      newSet.delete(empId);
    } else {
      newSet.add(empId);
    }
    setSelectedEmployees(newSet);
  };

  const groupedReports = useMemo(() => {
    // Start with all employees in the department (defaulting to 0 reports)
    const groups: Record<string, { employee: any, reports: DailyReport[] }> = {};
    
    departmentEmployees.forEach(emp => {
      groups[emp.id] = {
        employee: emp,
        reports: [],
      };
    });

    // Merge in the actual reports
    reports.forEach((report) => {
      const empId = (report as any).employee_id || report.employee?.id || 'unknown';
      if (!groups[empId]) {
        groups[empId] = {
          employee: report.employee || { id: 'unknown', name: 'Unknown', employee_id: 'N/A', department: '' },
          reports: [],
        };
      }
      groups[empId].reports.push(report);
    });
    
    return Object.values(groups).sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  }, [reports, departmentEmployees]);

  const groupedEmployeeTasks = useMemo(() => {
    if (!selectedEmployeeDetails) return [];
    const groups: Record<string, DailyReport[]> = {};
    selectedEmployeeDetails.reports.forEach(report => {
      const projName = report.task_name || 'Unknown Project';
      if (!groups[projName]) {
        groups[projName] = [];
      }
      groups[projName].push(report);
    });
    return Object.entries(groups).map(([project, tasks]) => ({ project, tasks }));
  }, [selectedEmployeeDetails]);

  const extractTaskDescription = (fullDesc: string) => {
    if (!fullDesc) return '';
    const taskMarker = 'Task:\n';
    const idx = fullDesc.indexOf(taskMarker);
    if (idx !== -1) {
      return fullDesc.substring(idx + taskMarker.length).trim();
    }
    return fullDesc.trim();
  };

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

  const handleExport = async () => {
    // Group by employee for the export to match the cards
    const exportData = selectedEmployees.size > 0 
      ? groupedReports.filter(g => selectedEmployees.has(g.employee.id))
      : groupedReports;

    if (exportData.length === 0) {
      Alert.alert('Notice', 'No employees available to export.');
      return;
    }

    try {
      const wsData = exportData.map((group) => {
        const uniqueDays = new Set(group.reports.map(r => r.report_date)).size;
        const totalReports = group.reports.length;
        const totalHours = group.reports.reduce((sum, r) => sum + parseHours(r.hours_worked), 0);
        const targetDays = filter === 'weekly' ? 6 : 26;
        const targetHours = targetDays * 7;
        const efficiency = ((totalHours / targetHours) * 100).toFixed(1) + '%';
        
        return {
          'Employee Name': group.employee?.name || '',
          'Employee ID': group.employee?.employee_id || '',
          'Department': group.employee?.department || '',
          'No. of Days': `${uniqueDays} / ${targetDays}`,
          'Reports Submitted': totalReports,
          'Total Hours': parseFloat(totalHours.toFixed(1)),
          'Efficiency': efficiency,
        };
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 20 }, // Department
        { wch: 15 }, // No. of Days
        { wch: 20 }, // Reports Submitted
        { wch: 15 }, // Total Hours
        { wch: 15 }, // Efficiency
      ];
      
      // Apply styles: Center everything except values (D, E, F, G) which are right-aligned
      for (const key in ws) {
        if (key[0] === '!') continue;
        const col = key[0];
        const row = key.substring(1);
        
        let hAlign = 'center';
        if (row !== '1' && ['D', 'E', 'F', 'G'].includes(col)) {
          hAlign = 'right'; // Values on the right
        }
        
        ws[key].s = {
          font: row === '1' ? { bold: true, color: { rgb: "000000" } } : undefined,
          alignment: {
            vertical: 'center',
            horizontal: hAlign,
            wrapText: true
          }
        };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reports");

      const fileName = `HOD_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: 'base64'
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Reports',
          UTI: 'com.microsoft.excel.xls'
        });
      }
    } catch (error: any) {
      console.error("Error generating Excel:", error);
      Alert.alert("Error", `Failed to generate Excel file: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const handleModalExport = async () => {
    if (!selectedEmployeeDetails) return;
    
    const reportsToExport = selectedEmployeeDetails.reports;

    if (reportsToExport.length === 0) {
      Alert.alert('Notice', 'No reports available to export.');
      return;
    }

    try {
      const wsData = reportsToExport.map((report) => ({
        'Employee Name': report.employee?.name || '',
        'Employee ID': report.employee?.employee_id || '',
        'Project': report.task_name || '',
        'Task Description': extractTaskDescription(report.work_description || ''),
        'Date': report.report_date || '',
        'Hours Worked': report.hours_worked || '',
        'Status': report.status ? String(report.status).replace('_', ' ').toUpperCase() : 'UNKNOWN',
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 20 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Project
        { wch: 50 }, // Task Description
        { wch: 15 }, // Date
        { wch: 15 }, // Hours Worked
        { wch: 15 }, // Status
      ];

      // Apply styles: Center everything except values (F: Hours Worked)
      for (const key in ws) {
        if (key[0] === '!') continue;
        const col = key[0];
        const row = key.substring(1);
        
        let hAlign = 'center';
        if (row !== '1' && col === 'F') {
          hAlign = 'right'; // Hours Worked on the right
        } else if (row !== '1' && col === 'D') {
          hAlign = 'left'; // Task Description left-aligned
        }
        
        ws[key].s = {
          font: row === '1' ? { bold: true, color: { rgb: "000000" } } : undefined,
          alignment: {
            vertical: 'center',
            horizontal: hAlign,
            wrapText: true
          }
        };
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employee Reports");

      const fileName = `${selectedEmployeeDetails.employee.employee_id || 'Emp'}_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: 'base64'
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Employee Reports',
          UTI: 'com.microsoft.excel.xls'
        });
      }
    } catch (error: any) {
      console.error("Error generating Excel:", error);
      Alert.alert("Error", `Failed to generate Excel file: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Employee Reports ({user?.department || 'Unknown Department'})</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={16} color="#FFF" />
            <Text style={styles.exportBtnText}>
              Export {selectedEmployees.size > 0 ? `(${selectedEmployees.size} Emp)` : 'All'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filters}>
          {renderFilter('all', 'All')}
          {renderFilter('weekly', 'Weekly')}
          {renderFilter('monthly', 'Monthly')} 
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {groupedReports.length === 0 ? (
            <Text style={styles.emptyText}>No reports found.</Text>
          ) : (
            groupedReports.map(group => {
              const emp = group.employee;
              const uniqueDays = new Set(group.reports.map(r => r.report_date)).size;
              const totalReports = group.reports.length;
              const totalHours = group.reports.reduce((sum, r) => sum + parseHours(r.hours_worked), 0);
              const targetDays = filter === 'weekly' ? 6 : 26;
              const targetHours = targetDays * 7;
              const efficiency = ((totalHours / targetHours) * 100).toFixed(1);

              return (
                <View
                  key={emp.id}
                  style={[styles.card, selectedEmployees.has(emp.id) && styles.cardSelected]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardEmpName} numberOfLines={1}>{emp.name}</Text>
                      <Text style={styles.cardEmpId}>{emp.employee_id} • {emp.department}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.checkbox, selectedEmployees.has(emp.id) && styles.checkboxSelected]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSelection(emp.id);
                      }}
                    >
                      {selectedEmployees.has(emp.id) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.cardLabel}>No. of Days:</Text>
                      <Text style={styles.cardValue}>{uniqueDays} / {targetDays}</Text>
                    </View>
                    <View style={styles.fieldRow}>
                      <Text style={styles.cardLabel}>Reporting Submission:</Text>
                      <Text style={styles.cardValue}>{totalReports} Reports</Text>
                    </View>
                    <View style={styles.fieldRow}>
                      <Text style={styles.cardLabel}>Efficiency:</Text>
                      <Text style={[styles.cardValue, { color: Number(efficiency) >= 100 ? Brand.colors.success : Brand.colors.warning }]}>
                        {efficiency}%
                      </Text>
                    </View>
                    <View style={styles.fieldRow}>
                      <Text style={styles.cardLabel}>Total Hrs:</Text>
                      <Text style={styles.cardValue}>{totalHours.toFixed(1)} hrs</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                    <TouchableOpacity 
                      style={styles.viewDetailsBtn}
                      onPress={() => setSelectedEmployeeDetails(group)}
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Employee Working Details Modal */}
      <Modal
        visible={!!selectedEmployeeDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedEmployeeDetails(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.modalContainer, { borderRadius: 12, overflow: 'hidden', flex: undefined, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedEmployeeDetails?.employee.name}'s Working Details</Text>
              <Text style={styles.modalSubtitle}>{selectedEmployeeDetails?.employee.employee_id} • {selectedEmployeeDetails?.employee.department}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity style={[styles.exportBtn, { paddingVertical: 8, paddingHorizontal: 12 }]} onPress={handleModalExport}>
                <Ionicons name="download-outline" size={16} color="#FFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedEmployeeDetails(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Brand.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flex: 1, padding: 16 }}>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col, { flex: 0.5 }]}>S.No</Text>
                <Text style={[styles.col, { flex: 1.5 }]}>Project</Text>
                <Text style={[styles.col, { flex: 2 }]}>Task Description</Text>
                <Text style={[styles.col, { flex: 1.5 }]}>Date and Time</Text>
                <Text style={[styles.col, { flex: 0.8, textAlign: 'center' }]}>Hrs</Text>
                <Text style={[styles.col, { flex: 1, textAlign: 'right' }]}>Status</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {groupedEmployeeTasks.map((group, index) => (
                  <View key={group.project} style={[styles.tableRow, { paddingVertical: 0, paddingHorizontal: 0, alignItems: 'stretch' }]}>
                    <View style={{ flex: 2, flexDirection: 'row', padding: 16, borderRightWidth: 1, borderRightColor: '#F3F4F6' }}>
                      <Text style={[styles.cell, { flex: 0.5, fontWeight: '700' }]}>{index + 1}</Text>
                      <Text style={[styles.cell, styles.projectHighlight, { flex: 1.5, paddingRight: 8 }]} numberOfLines={2}>{group.project}</Text>
                    </View>
                    <View style={{ flex: 5.3, flexDirection: 'column' }}>
                      {group.tasks.map((task, tIndex) => (
                        <View key={task.id} style={{ 
                          flexDirection: 'row', 
                          padding: 16, 
                          borderBottomWidth: tIndex < group.tasks.length - 1 ? 1 : 0, 
                          borderBottomColor: '#F3F4F6',
                          alignItems: 'center'
                        }}>
                          <Text style={[styles.cell, { flex: 2 }]} numberOfLines={3}>{extractTaskDescription(task.work_description)}</Text>
                          <Text style={[styles.cell, { flex: 1.5 }]}>{task.report_date}</Text>
                          <Text style={[styles.cell, { flex: 0.8, textAlign: 'center' }]}>{task.hours_worked}</Text>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                              <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                                {task.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.colors.text },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  exportBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filters: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Brand.colors.border,
    padding: 16,
    width: 320, // fixed width for cards to form a nice grid
    minHeight: 200,
  },
  cardSelected: {
    borderColor: Brand.colors.primary,
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Brand.colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardEmpName: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  cardEmpId: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Brand.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Brand.colors.primary,
    borderColor: Brand.colors.primary,
  },
  cardBody: {
    flex: 1,
    gap: 8,
    paddingTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.colors.textSecondary,
  },
  cardValue: {
    fontSize: 14,
    color: Brand.colors.text,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    backgroundColor: '#FEF3C7', // Light yellow/orange like the 1st image
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewDetailsText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: Brand.colors.textSecondary, padding: 40, width: '100%' },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Brand.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    flex: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: Brand.colors.border,
    backgroundColor: '#F3F4F6',
  },
  col: { fontSize: 13, fontWeight: '800', color: '#111827', textTransform: 'uppercase' },
  projectHighlight: { fontSize: 14, fontWeight: '800', color: '#111827' },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  cell: { fontSize: 13, color: Brand.colors.text, paddingRight: 8 },
});
