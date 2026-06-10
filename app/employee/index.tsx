import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';

import { Brand } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [duration, setDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [departmentProjects, setDepartmentProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (user?.department) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('department', user?.department);
        
      if (error) throw error;
      setDepartmentProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  // Generate time options
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  }, []);

  // Auto-calculate duration only when pickers change
  useEffect(() => {
    if (startTime && endTime) {
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');
      
      if (startParts.length === 2 && endParts.length === 2) {
        const startHours = parseInt(startParts[0], 10);
        const startMins = parseInt(startParts[1], 10);
        const endHours = parseInt(endParts[0], 10);
        const endMins = parseInt(endParts[1], 10);
        
        if (!isNaN(startHours) && !isNaN(startMins) && !isNaN(endHours) && !isNaN(endMins)) {
          let diffMins = (endHours * 60 + endMins) - (startHours * 60 + startMins);
          if (diffMins < 0) {
            diffMins += 24 * 60; // Handle overnight shifts
          }
          
          const durHours = Math.floor(diffMins / 60);
          const durMins = diffMins % 60;
          setDuration(`${durHours.toString().padStart(2, '0')}:${durMins.toString().padStart(2, '0')}`);
        }
      }
    } else {
      setDuration('');
    }
  }, [startTime, endTime]);

  const handleSaveTask = async () => {
    if (!description.trim()) {
      alert('Please enter a task description');
      return;
    }

    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    if (!duration.trim()) {
      alert('Please enter a valid duration');
      return;
    }

    setIsSaving(true);
    
    try {
      let hoursWorked = 0;
      if (duration.includes(':')) {
        const parts = duration.split(':');
        hoursWorked = parseInt(parts[0] || '0', 10) + (parseInt(parts[1] || '0', 10) / 60);
      } else {
        hoursWorked = parseFloat(duration);
      }

      if (isNaN(hoursWorked) || hoursWorked <= 0) {
        alert('Please enter a valid duration (e.g. 01:30 or 1.5)');
        setIsSaving(false);
        return;
      }

      const selectedProjectObj = departmentProjects.find(p => p.projectid === selectedProject);
      const taskNameToSave = selectedProjectObj ? selectedProjectObj.projectname : (description.split('\n')[0].substring(0, 50) || 'Task');
      const descToSave = selectedProjectObj 
        ? `Project ID: ${selectedProjectObj.projectid}\nCustomer: ${selectedProjectObj.customername}\n\nTask:\n${description}`
        : description;

      const { error } = await supabase.from('daily_reports').insert({
        employee_id: user?.id,
        report_date: new Date().toISOString().split('T')[0],
        task_name: taskNameToSave,
        work_description: descToSave,
        hours_worked: Number(hoursWorked.toFixed(2)),
        completion_percentage: 100,
        status: 'submitted'
      });

      if (error) throw error;
      
      alert('Task saved successfully!');
      handleAddNewTask();
    } catch (err: any) {
      alert('Failed to save task: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewTask = () => {
    setDescription('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDuration('');
    setSelectedProject('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerIndicator} />
          <Text style={styles.headerTitle}>NEW TASK</Text>
        </View>

      <View style={styles.form}>
        {/* Project Selection */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="briefcase-outline" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>Project</Text>
          </View>
          <View style={styles.inputContainerRow}>
            <View style={[styles.inputWrapper, { padding: 0 }]}>
              <Picker
                selectedValue={selectedProject}
                onValueChange={(val) => setSelectedProject(val)}
                style={styles.picker}
              >
                <Picker.Item label="Select Project" value="" color="#9CA3AF" />
                {departmentProjects.map(proj => (
                  <Picker.Item key={proj.id} label={`${proj.projectid} - ${proj.projectname}`} value={proj.projectid} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Customer Name (Read Only) */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="business-outline" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>Customer</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: '#6B7280', backgroundColor: '#F3F4F6', width: '100%' }]}
              placeholder="Auto-filled from project"
              placeholderTextColor="#9CA3AF"
              value={departmentProjects.find(p => p.projectid === selectedProject)?.customername || ''}
              editable={false}
            />
          </View>
        </View>

        {/* Task Description */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="list" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>Task Description</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter task description..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Start Time */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="time-outline" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>Start Time</Text>
          </View>
          <View style={styles.inputContainerRow}>
            <View style={[styles.inputWrapper, { padding: 0 }]}>
              <Picker
                selectedValue={startTime}
                onValueChange={(val) => setStartTime(val)}
                style={styles.picker}
              >
                {timeOptions.map(time => (
                  <Picker.Item key={time} label={time} value={time} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* End Time */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="time-outline" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>End Time</Text>
          </View>
          <View style={styles.inputContainerRow}>
            <View style={[styles.inputWrapper, { padding: 0 }]}>
              <Picker
                selectedValue={endTime}
                onValueChange={(val) => setEndTime(val)}
                style={styles.picker}
              >
                {timeOptions.map(time => (
                  <Picker.Item key={time} label={time} value={time} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.fieldRow}>
          <View style={styles.labelContainer}>
            <Ionicons name="hourglass-outline" size={20} color={Brand.colors.primary} />
            <Text style={styles.label}>Duration</Text>
          </View>
          <View style={styles.inputContainerRow}>
            <View style={[styles.inputWrapper, styles.durationWrapper]}>
              <Ionicons name="time-outline" size={18} color="#6B7280" style={styles.inputIconLeft} />
              <TextInput
                style={[styles.inputWithIcons, styles.durationInput]}
                placeholder="e.g., 01:30"
                placeholderTextColor="#9CA3AF"
                value={duration}
                onChangeText={setDuration}
                editable={true} // Allow manual entry
              />
              <View style={styles.durationSuffix}>
                <Text style={styles.durationSuffixText}>HH:MM</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.spacer} />
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
              onPress={handleSaveTask}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={Brand.colors.white} size="small" />
              ) : (
                <Ionicons name="save-outline" size={18} color={Brand.colors.white} />
              )}
              <Text style={styles.saveButtonText}>Save Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddNewTask}>
              <Ionicons name="add" size={18} color={Brand.colors.primary} />
              <Text style={styles.addButtonText}>Add New Task</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    maxWidth: 800,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 24,
  },
  headerIndicator: {
    width: 4,
    height: 20,
    backgroundColor: Brand.colors.primary,
    marginRight: 12,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.colors.primaryDark,
    letterSpacing: 0.5,
  },
  form: {
    gap: 24,
  },
  fieldRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  inputContainer: {
    width: '100%',
  },
  inputContainerRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 6,
    backgroundColor: Brand.colors.white,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    color: Brand.colors.text,
    backgroundColor: Brand.colors.white,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  inputWithIcons: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: Brand.colors.text,
  },
  inputIconLeft: {
    paddingLeft: 12,
  },
  inputIconRight: {
    paddingRight: 12,
  },
  picker: {
    flex: 1,
    minHeight: 54,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: Brand.colors.text,
  },
  durationWrapper: {
    backgroundColor: '#F9FAFB', // Slight grey for read-only feel
  },
  durationInput: {
    color: Brand.colors.primaryDark,
    fontWeight: '600',
  },
  durationSuffix: {
    borderLeftWidth: 1,
    borderLeftColor: Brand.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  durationSuffixText: {
    color: Brand.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 16,
  },
  spacer: {
    display: 'none',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  saveButton: {
    backgroundColor: Brand.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 8,
  },
  saveButtonText: {
    color: Brand.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Brand.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    gap: 8,
  },
  addButtonText: {
    color: Brand.colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
