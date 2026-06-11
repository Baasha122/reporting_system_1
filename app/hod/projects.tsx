import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/brand';

export default function ProjectsScreen() {
  const { user } = useAuth();
  const [newProject, setNewProject] = useState({
    projectId: '',
    projectName: '',
    customerName: '',
  });
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.department) return;
    try {
      setIsLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('department', user.department)
        .order('datetime', { ascending: false });
      
      if (!error && data) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.projectId || !newProject.projectName) {
      if (Platform.OS === 'web') { alert("Please fill all project details."); } else { Alert.alert("Error", "Please fill all project details."); }
      return;
    }
    
    setIsSubmittingProject(true);
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('projects')
        .select('projectid')
        .eq('projectid', newProject.projectId);
        
      if (existing && existing.length > 0) {
        const msg = "Error: Project ID must be unique. This ID already exists!";
        if (Platform.OS === 'web') { alert(msg); } else { Alert.alert("Error", msg); }
        setIsSubmittingProject(false);
        return;
      }

      const { error } = await supabase.from('projects').insert([
        {
          projectid: newProject.projectId,
          projectname: newProject.projectName,
          customername: newProject.customerName,
          department: user?.department || '',
          status: 'onGoing',
        }
      ]);
      
      if (error) throw error;
      
      const successMsg = "Project created successfully!";
      if (Platform.OS === 'web') { alert(successMsg); } else { Alert.alert("Success", successMsg); }
      setNewProject({ projectId: '', projectName: '', customerName: '' });
      fetchProjects();
    } catch (err: any) {
      const errMsg = "Failed to create project: " + err.message;
      if (Platform.OS === 'web') { alert(errMsg); } else { Alert.alert("Error", errMsg); }
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleUpdateStatus = (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'onGoing' ? 'close' : 'onGoing';
    const actionText = currentStatus === 'onGoing' ? 'Mark as Completed' : 'Mark as Ongoing';
    
    const updateStatus = async () => {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', projectId);
        
        if (error) throw error;
        
        if (Platform.OS === 'web') {
          alert(`Project status updated to ${newStatus === 'onGoing' ? 'ONGOING' : 'COMPLETED'}`);
        }
        
        fetchProjects();
      } catch (err: any) {
        if (Platform.OS === 'web') alert('Error updating status: ' + err.message);
        else Alert.alert('Error', err.message);
      }
    };

    if (Platform.OS === 'web') {
      const confirmUpdate = window.confirm(`Are you sure you want to ${actionText}?`);
      if (confirmUpdate) {
        updateStatus();
      }
    } else {
      Alert.alert(
        "Update Status",
        `Are you sure you want to ${actionText}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: updateStatus }
        ]
      );
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.headerIndicator} />
          <Text style={styles.headerTitle}>CREATE DEPARTMENT PROJECT</Text>
        </View>
      </View>
      <View style={styles.createProjectCard}>
        <View style={styles.projectInputRow}>
          <View style={styles.projectInputGroup}>
            <Text style={styles.inputLabel}>Project ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. PRJ-101"
              value={newProject.projectId}
              onChangeText={(text) => setNewProject({...newProject, projectId: text})}
            />
          </View>
          <View style={styles.projectInputGroup}>
            <Text style={styles.inputLabel}>Project Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Website Redesign"
              value={newProject.projectName}
              onChangeText={(text) => setNewProject({...newProject, projectName: text})}
            />
          </View>
          <View style={styles.projectInputGroup}>
            <Text style={styles.inputLabel}>Customer Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Acme Corp"
              value={newProject.customerName}
              onChangeText={(text) => setNewProject({...newProject, customerName: text})}
            />
          </View>
          <View style={{ justifyContent: 'flex-end', paddingBottom: 2 }}>
            <TouchableOpacity 
              style={[styles.saveBtn, isSubmittingProject && styles.saveBtnDisabled]} 
              onPress={handleCreateProject} 
              disabled={isSubmittingProject}
            >
              {isSubmittingProject ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.sectionHeader, { justifyContent: 'space-between', marginTop: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.headerIndicator} />
          <Text style={styles.headerTitle}>DEPARTMENT PROJECTS</Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        {isLoadingProjects ? (
          <ActivityIndicator size="large" color={Brand.colors.primary} style={{ margin: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableCol, {flex: 1, minWidth: 100}]}>Project ID</Text>
                <Text style={[styles.tableCol, {flex: 2, minWidth: 200}]}>Project Name</Text>
                <Text style={[styles.tableCol, {flex: 2, minWidth: 200}]}>Customer Name</Text>
                <Text style={[styles.tableCol, {flex: 1, minWidth: 100, textAlign: 'center'}]}>Status</Text>
              </View>
              
              {projects.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#6B7280' }}>No projects created yet.</Text>
                </View>
              ) : (
                projects.map((proj, i) => (
                  <View key={proj.id || i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, {flex: 1, minWidth: 100, fontWeight: '500'}]}>{proj.projectid}</Text>
                    <Text style={[styles.tableCell, {flex: 2, minWidth: 200}]} numberOfLines={1}>{proj.projectname}</Text>
                    <Text style={[styles.tableCell, {flex: 2, minWidth: 200}]} numberOfLines={1}>{proj.customername || '-'}</Text>
                    <View style={{flex: 1, minWidth: 100, alignItems: 'center'}}>
                      <TouchableOpacity 
                        onPress={() => handleUpdateStatus(proj.id, proj.status)}
                        style={[
                          styles.statusChip, 
                          {backgroundColor: proj.status === 'onGoing' ? '#EBF4FF' : '#DEF7EC'}
                        ]}
                      >
                        <Text style={[
                          styles.statusText, 
                          {color: proj.status === 'onGoing' ? '#0056FF' : '#03543F'}
                        ]}>
                          {proj.status === 'onGoing' ? 'ONGOING' : (proj.status === 'close' ? 'COMPLETED' : String(proj.status || 'UNKNOWN').toUpperCase())}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerIndicator: { width: 4, height: 16, backgroundColor: '#0056FF', marginRight: 8, borderRadius: 2 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: Brand.colors.primaryDark, letterSpacing: 0.5 },
  createProjectCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  projectInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  projectInputGroup: { flex: 1, minWidth: 150 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, height: 40, fontSize: 14 },
  saveBtn: { backgroundColor: '#0056FF', height: 40, paddingHorizontal: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  tableCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  table: { minWidth: '100%' },
  tableRowHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 8 },
  tableCol: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center', paddingHorizontal: 8 },
  tableCell: { fontSize: 14, color: '#1F2937' },
  statusChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
});
