import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, SafeAreaView, TextInput, Pressable, FlatList, useWindowDimensions } from 'react-native';
import * as XLSX from 'xlsx-js-style';

import { Brand } from '@/constants/brand';
import { fetchReports } from '@/services/reports-api';
import { DailyReport, ReportStatus } from '@/types/report';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1200 ? 3 : (width >= 768 ? 2 : 1);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [reportType, setReportType] = useState<'projects' | 'employees' | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<{ employee: any, reports: DailyReport[] } | null>(null);
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);
  const [departmentProjects, setDepartmentProjects] = useState<any[]>([]);
  const [modalPage, setModalPage] = useState(1);

  useEffect(() => {
    setModalPage(1);
  }, [selectedEmployeeDetails]);

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

          const { data: projs } = await supabase
            .from('projects')
            .select('projectname, projectid')
            .eq('department', dept)
            .eq('status', 'onGoing')
            .order('projectname', { ascending: true });
          setDepartmentProjects(projs || []);
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
      } else if (filter === 'reports') {
        // No date filter, fetches all time for this department
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
    <Pressable
      style={({ hovered, pressed }) => [
        styles.filterChip,
        filter === status && styles.filterChipActive,
        hovered && styles.filterChipHovered,
        pressed && { opacity: 0.7 }
      ] as any}
      onPress={() => {
        setFilter(status);
        if (status !== 'reports') {
          setReportType('');
          setSelectedProjectId('');
          setSelectedEmployeeId('');
          setCustomStartDate('');
          setCustomEndDate('');
        }
      }}
    >
      <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
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

  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    reports.forEach(r => {
      if (r.task_name) projects.add(r.task_name);
    });
    return Array.from(projects).sort();
  }, [reports]);

  const filteredReportsForDisplay = useMemo(() => {
    let filtered = reports;
    if (filter === 'reports') {
      if (reportType === 'projects' && selectedProjectId) {
        filtered = filtered.filter(r => r.task_name === selectedProjectId);
        if (customStartDate) {
          filtered = filtered.filter(r => r.report_date >= customStartDate);
        }
        if (customEndDate) {
          filtered = filtered.filter(r => r.report_date <= customEndDate);
        }
      } else if (reportType === 'employees') {
        if (selectedEmployeeId) {
          filtered = filtered.filter(r => (r as any).employee_id === selectedEmployeeId || (r as any).actual_employee_id === selectedEmployeeId);
        }
        if (customStartDate) {
          filtered = filtered.filter(r => r.report_date >= customStartDate);
        }
        if (customEndDate) {
          filtered = filtered.filter(r => r.report_date <= customEndDate);
        }
      }
    }
    return filtered;
  }, [reports, filter, reportType, selectedProjectId, selectedEmployeeId, customStartDate, customEndDate]);

  const groupedReports = useMemo(() => {
    // Start with all employees in the department (defaulting to 0 reports)
    const groups: Record<string, { employee: any, reports: DailyReport[] }> = {};

    let employeesToGroup = departmentEmployees;
    if (filter === 'reports' && reportType === 'employees' && selectedEmployeeId) {
      employeesToGroup = employeesToGroup.filter(emp => emp.id === selectedEmployeeId || emp.employee_id === selectedEmployeeId);
    }

    employeesToGroup.forEach(emp => {
      groups[emp.id] = {
        employee: emp,
        reports: [],
      };
    });

    // Merge in the actual reports
    filteredReportsForDisplay.forEach((report) => {
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
  }, [filteredReportsForDisplay, departmentEmployees, filter, reportType, selectedEmployeeId]);

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

  const ITEMS_PER_PAGE = 3;
  const totalModalPages = Math.ceil(groupedEmployeeTasks.length / ITEMS_PER_PAGE) || 1;

  const paginatedTasks = useMemo(() => {
    return groupedEmployeeTasks.slice((modalPage - 1) * ITEMS_PER_PAGE, modalPage * ITEMS_PER_PAGE);
  }, [groupedEmployeeTasks, modalPage]);

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

  const selectedEmployeeEfficiency = useMemo(() => {
    if (reportType !== 'employees' || !selectedEmployeeId) return null;
    const totalWorked = filteredReportsForDisplay.reduce((sum, r) => sum + parseHours(r.hours_worked), 0);
    
    let targetDays = 26; // Default to monthly if no date range
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (customStartDate) {
      const start = new Date(customStartDate);
      const end = new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const targetHours = targetDays * 8;
    return targetHours > 0 ? ((totalWorked / targetHours) * 100).toFixed(1) : '0.0';
  }, [reportType, selectedEmployeeId, filteredReportsForDisplay, customStartDate, customEndDate]);

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
        const uri = (FileSystem as any).documentDirectory + fileName;

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
        const uri = (FileSystem as any).documentDirectory + fileName;

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
        <View>
          <Text style={styles.title}>Employee Reports</Text>
          <Text style={styles.subtitle}>Review reports for {user?.department || 'Unknown Department'}</Text>
        </View>
        <Pressable
          style={({ hovered, pressed }) => [
            styles.exportBtn,
            hovered && styles.exportBtnHovered,
            pressed && { opacity: 0.7 }
          ] as any}
          onPress={handleExport}
        >
          <Ionicons name="download-outline" size={16} color="#FFF" />
          <Text style={styles.exportBtnText}>
            Export {selectedEmployees.size > 0 ? `(${selectedEmployees.size} Emp)` : 'All'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.filtersContainer}>
        {/* Wireframe format: Filters row aligned below the banner */}
        <View style={styles.filters}>
          {renderFilter('all', 'All')}
          {renderFilter('reports', 'Reports')}
          {renderFilter('weekly', 'Weekly')}
          {renderFilter('monthly', 'Monthly')}
        </View>
        
        {filter === 'reports' && (
          <View style={styles.customDateContainer}>
            {/* Wireframe format: Two large dropdowns side by side, then a Search button */}
            <View style={styles.filterRow}>
              <View style={styles.pickerWrapperLarge}>
                <Picker
                  selectedValue={reportType}
                  onValueChange={(itemValue) => {
                    setReportType(itemValue as any);
                    setSelectedProjectId('');
                    setSelectedEmployeeId('');
                  }}
                  style={styles.pickerLarge}
                >
                  <Picker.Item label="Select Type" value="" />
                  <Picker.Item label="Projects" value="projects" />
                  <Picker.Item label="Employees" value="employees" />
                </Picker>
              </View>

              <View style={styles.pickerWrapperLarge}>
                {reportType === 'projects' ? (
                  <Picker
                    selectedValue={selectedProjectId}
                    onValueChange={(itemValue) => setSelectedProjectId(itemValue)}
                    style={styles.pickerLarge}
                  >
                    <Picker.Item label="Select Project" value="" />
                    {departmentProjects.map(p => (
                      <Picker.Item key={p.projectid} label={p.projectname} value={p.projectname} />
                    ))}
                  </Picker>
                ) : reportType === 'employees' ? (
                  <Picker
                    selectedValue={selectedEmployeeId}
                    onValueChange={(itemValue) => setSelectedEmployeeId(itemValue)}
                    style={styles.pickerLarge}
                  >
                    <Picker.Item label="Select Employee" value="" />
                    {departmentEmployees.map(emp => (
                      <Picker.Item key={emp.id} label={`${emp.name} (${emp.employee_id})`} value={emp.id} />
                    ))}
                  </Picker>
                ) : (
                  <Picker enabled={false} selectedValue="" onValueChange={() => {}} style={styles.pickerLarge}>
                    <Picker.Item label="Select Sub-Type" value="" />
                  </Picker>
                )}
              </View>

              <Pressable
                style={({ hovered, pressed }) => [
                  styles.applyBtnLarge,
                  hovered && styles.applyBtnLargeHovered,
                  pressed && { opacity: 0.7 }
                ] as any}
                onPress={() => { }}
              >
                <Text style={styles.applyBtnTextLarge}>Search</Text>
              </Pressable>
            </View>

            {reportType === 'employees' && (
              <View style={styles.filterRow}>
                <View style={styles.dateInputWrapper}>
                  <Ionicons name="calendar-outline" size={16} color={Brand.colors.textSecondary} />
                  <TextInput
                    style={styles.dateInput}
                    placeholder="Start Date (YYYY-MM-DD)"
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholderTextColor={Brand.colors.textSecondary}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Ionicons name="calendar-outline" size={16} color={Brand.colors.textSecondary} />
                  <TextInput
                    style={styles.dateInput}
                    placeholder="End Date (YYYY-MM-DD)"
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholderTextColor={Brand.colors.textSecondary}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : filter === 'reports' ? (
        <ScrollView contentContainerStyle={styles.reportListContainer}>
          {reportType === 'employees' && selectedEmployeeId && (
            <View style={styles.employeeDetailsSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.reportHeading, { marginBottom: 0 }]}>
                  {departmentEmployees.find(e => e.id === selectedEmployeeId)?.name || 'Unknown Employee'}
                </Text>
                {selectedEmployeeEfficiency !== null && (
                  <View style={[styles.statusBadge, { backgroundColor: Number(selectedEmployeeEfficiency) >= 100 ? Brand.colors.success + '20' : Brand.colors.warning + '20' }]}>
                    <Text style={[styles.statusText, { color: Number(selectedEmployeeEfficiency) >= 100 ? Brand.colors.success : Brand.colors.warning }]}>
                      Efficiency: {selectedEmployeeEfficiency}%
                    </Text>
                  </View>
                )}
              </View>

              {Object.entries(
                filteredReportsForDisplay.reduce((acc, report) => {
                  const proj = report.task_name || 'Unknown Project';
                  if (!acc[proj]) acc[proj] = [];
                  acc[proj].push(report);
                  return acc;
                }, {} as Record<string, DailyReport[]>)
              ).map(([project, tasks]) => (
                <View key={project} style={styles.projectGroup}>
                  <Text style={styles.projectHeading}>{project}</Text>
                  {tasks.map((task, idx) => (
                    <View key={task.id || idx} style={styles.taskRow}>
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {extractTaskDescription(task.work_description)}
                      </Text>
                      <Text style={styles.taskDate}>
                        {task.report_date}
                      </Text>
                      <Text style={styles.taskDuration}>
                        {task.hours_worked} {String(task.hours_worked).includes(':') ? '' : 'hrs'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              {filteredReportsForDisplay.length === 0 && (
                <Text style={styles.emptyText}>No reports found for this employee in the selected date range.</Text>
              )}
            </View>
          )}

          {reportType === 'projects' && selectedProjectId && (
            <View style={styles.employeeDetailsSection}>
              <Text style={styles.reportHeading}>
                Project: {selectedProjectId}
              </Text>

              {Object.entries(
                filteredReportsForDisplay.reduce((acc, report) => {
                  const empName = departmentEmployees.find(e => e.id === (report as any).employee_id || e.id === (report as any).actual_employee_id)?.name || 'Unknown Employee';
                  if (!acc[empName]) acc[empName] = [];
                  acc[empName].push(report);
                  return acc;
                }, {} as Record<string, DailyReport[]>)
              ).map(([empName, tasks]) => (
                <View key={empName} style={styles.projectGroup}>
                  <Text style={styles.projectHeading}>{empName}</Text>
                  {tasks.map((task, idx) => (
                    <View key={task.id || idx} style={styles.taskRow}>
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {extractTaskDescription(task.work_description)}
                      </Text>
                      <Text style={styles.taskDate}>
                        {task.report_date}
                      </Text>
                      <Text style={styles.taskDuration}>
                        {task.hours_worked} {String(task.hours_worked).includes(':') ? '' : 'hrs'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              {filteredReportsForDisplay.length === 0 && (
                <Text style={styles.emptyText}>No reports found for this project.</Text>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.rowWrapper : undefined}
          data={groupedReports}
          keyExtractor={(item) => item.employee.id}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reports found.</Text>
          }
          renderItem={({ item: group }) => {
            const emp = group.employee;
            const uniqueDays = new Set(group.reports.map(r => r.report_date)).size;
            const totalReports = group.reports.length;
            const totalHours = group.reports.reduce((sum, r) => sum + parseHours(r.hours_worked), 0);
            const targetDays = filter === 'weekly' ? 6 : 26;
            const targetHours = targetDays * 8;
            const efficiency = ((totalHours / targetHours) * 100).toFixed(1);

            return (
              <Pressable
                key={emp.id}
                style={({ hovered }) => [
                  styles.card,
                  selectedEmployees.has(emp.id) && styles.cardSelected,
                  hovered && styles.cardHovered
                ] as any}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardEmpName} numberOfLines={1}>{emp.name}</Text>
                    <Text style={styles.cardEmpId}>{emp.employee_id} • {emp.department}</Text>
                  </View>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.checkbox,
                      selectedEmployees.has(emp.id) && styles.checkboxSelected,
                      hovered && styles.checkboxHovered,
                      pressed && { opacity: 0.7 }
                    ] as any}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleSelection(emp.id);
                    }}
                  >
                    {selectedEmployees.has(emp.id) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </Pressable>
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
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.viewDetailsBtn,
                      hovered && styles.viewDetailsBtnHovered,
                      pressed && { opacity: 0.7 }
                    ] as any}
                    onPress={() => setSelectedEmployeeDetails(group)}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
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
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.exportBtn,
                    { paddingVertical: 8, paddingHorizontal: 12 },
                    hovered && styles.exportBtnHovered,
                    pressed && { opacity: 0.7 }
                  ] as any}
                  onPress={handleModalExport}
                >
                  <Ionicons name="download-outline" size={16} color="#FFF" />
                  <Text style={styles.exportBtnText}>Export</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedEmployeeDetails(null)}
                  style={({ hovered, pressed }) => [
                    styles.closeBtn,
                    hovered && styles.closeBtnHovered,
                    pressed && { opacity: 0.7 }
                  ] as any}
                >
                  <Ionicons name="close" size={24} color={Brand.colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={{ flex: 1, padding: 16 }}>
              <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 750 }}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.col, { flex: 0.5 }]}>S.No</Text>
                      <Text style={[styles.col, { flex: 1.5 }]}>Project</Text>
                      <Text style={[styles.col, { flex: 2 }]}>Task Description</Text>
                      <Text style={[styles.col, { flex: 1.5 }]}>Date and Time</Text>
                      <Text style={[styles.col, { flex: 0.8, textAlign: 'center' }]}>Hrs</Text>
                      <Text style={[styles.col, { flex: 1, textAlign: 'right' }]}>Status</Text>
                    </View>
                    <ScrollView>
                      {paginatedTasks.map((group, index) => (
                        <View key={group.project} style={[styles.tableRow, { paddingVertical: 0, paddingHorizontal: 0, alignItems: 'stretch' }]}>
                          <View style={{ flex: 2, flexDirection: 'row', padding: 16, borderRightWidth: 1, borderRightColor: '#F3F4F6' }}>
                            <Text style={[styles.cell, { flex: 0.5, fontWeight: '700' }]}>{(modalPage - 1) * ITEMS_PER_PAGE + index + 1}</Text>
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
                </ScrollView>
              </View>

              {/* Modal Pagination Controls */}
              {totalModalPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity 
                    style={[styles.pageBtn, modalPage === 1 && styles.pageBtnDisabled]} 
                    disabled={modalPage === 1}
                    onPress={() => setModalPage(prev => Math.max(prev - 1, 1))}
                  >
                    <Ionicons name="chevron-back" size={16} color={modalPage === 1 ? '#9CA3AF' : Brand.colors.primary} />
                    <Text style={[styles.pageBtnText, modalPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.pageIndicator}>
                    Page {modalPage} of {totalModalPages}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.pageBtn, modalPage === totalModalPages && styles.pageBtnDisabled]} 
                    disabled={modalPage === totalModalPages}
                    onPress={() => setModalPage(prev => Math.min(prev + 1, totalModalPages))}
                  >
                    <Text style={[styles.pageBtnText, modalPage === totalModalPages && styles.pageBtnTextDisabled]}>Next</Text>
                    <Ionicons name="chevron-forward" size={16} color={modalPage === totalModalPages ? '#9CA3AF' : Brand.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
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
  },
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
  filtersContainer: { gap: 24 },
  filters: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Brand.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipHovered: {
    backgroundColor: '#F9FAFB',
    borderColor: Brand.colors.primary,
  },
  filterChipActive: {
    backgroundColor: Brand.colors.primary,
    borderColor: Brand.colors.primary,
  },
  filterText: { fontSize: 14, fontWeight: '600', color: Brand.colors.textSecondary },
  filterTextActive: { color: '#FFF' },
  customDateContainer: {
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  pickerWrapperLarge: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 8,
    height: 56,
    flex: 1,
    minWidth: 240,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pickerLarge: {
    height: 56,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: Brand.colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    gap: 8,
    minWidth: 240,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: Brand.colors.text,
    height: '100%',
  },
  applyBtnLarge: {
    backgroundColor: Brand.colors.primary,
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Brand.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  applyBtnLargeHovered: {
    backgroundColor: Brand.colors.primaryDark || '#0041CC',
    opacity: 0.9,
  },
  applyBtnTextLarge: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reportListContainer: {
    paddingBottom: 24,
  },
  employeeDetailsSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    marginTop: 8,
    maxWidth: 900, // Prevents the card from stretching too wide on large screens
  },
  reportHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.colors.text,
    marginBottom: 16,
  },
  projectGroup: {
    marginBottom: 16,
    marginLeft: 16,
  },
  projectHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.colors.text,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginLeft: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    maxWidth: 600, // Brings the duration much closer to the task description
  },
  taskDesc: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    flex: 1,
    paddingRight: 16,
  },
  taskDate: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    width: 100,
    textAlign: 'center',
    paddingRight: 16,
  },
  taskDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.colors.text,
    width: 80,
    textAlign: 'left', // Aligned left so it sits nicely next to the description
  },
  projectTableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: Brand.colors.border,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  projectTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  projectTableCell: {
    fontSize: 14,
    color: Brand.colors.text,
  },
  projectTableCellDesc: {
    color: Brand.colors.textSecondary,
    paddingRight: 16,
  },
  projectTableCellDuration: {
    fontWeight: '600',
  },
  gridContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  rowWrapper: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Brand.colors.border,
    padding: 16,
    minHeight: 200,
    transitionProperty: 'all',
    transitionDuration: '200ms',
  },
  cardHovered: {
    borderColor: Brand.colors.primary,
    shadowColor: Brand.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ translateY: -2 }],
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
  checkboxHovered: {
    borderColor: Brand.colors.primary,
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
  viewDetailsBtnHovered: {
    backgroundColor: '#FDE68A', // Slightly darker yellow on hover
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
  closeBtnHovered: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  exportBtnHovered: {
    backgroundColor: Brand.colors.primaryDark || '#0041CC',
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
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
    backgroundColor: '#FFF',
  },
  pageBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  pageBtnText: {
    color: Brand.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.colors.textSecondary,
  },
});
