import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportFormFields } from '@/components/reports/report-form-fields';
import { Brand } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { createReport, fetchReport, updateReport } from '@/services/reports-api';
import { ReportFormData } from '@/types/report';
import { todayIsoDate } from '@/utils/report-status';

const EMPTY_FORM: ReportFormData = {
  report_date: todayIsoDate(),
  task_name: '',
  work_description: '',
  hours_worked: '',
  challenges_faced: '',
  completion_percentage: '',
  evidence_url: '',
};

function validateForm(values: ReportFormData) {
  if (!values.task_name.trim()) return 'Task name is required';
  if (!values.work_description.trim()) return 'Work description is required';
  const hours = Number(values.hours_worked);
  if (!hours || hours <= 0 || hours > 24) return 'Enter valid hours worked (1-24)';
  const completion = Number(values.completion_percentage);
  if (Number.isNaN(completion) || completion < 0 || completion > 100) {
    return 'Completion must be between 0 and 100';
  }
  return null;
}

function toPayload(values: ReportFormData, submit: boolean) {
  return {
    report_date: values.report_date,
    task_name: values.task_name.trim(),
    work_description: values.work_description.trim(),
    hours_worked: Number(values.hours_worked),
    challenges_faced: values.challenges_faced.trim() || null,
    completion_percentage: Number(values.completion_percentage),
    evidence_url: values.evidence_url.trim() || null,
    submit,
  };
}

export default function ReportFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [values, setValues] = useState<ReportFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const report = await fetchReport(Number(id));
        setValues({
          report_date: report.report_date,
          task_name: report.task_name,
          work_description: report.work_description,
          hours_worked: String(report.hours_worked),
          challenges_faced: report.challenges_faced ?? '',
          completion_percentage: String(report.completion_percentage),
          evidence_url: report.evidence_url ?? '',
        });
      } catch (err) {
        Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to load report');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleChange = (field: keyof ReportFormData, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (submit: boolean) => {
    const validationError = validateForm(values);
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateReport(Number(id), toPayload(values, submit));
      } else {
        await createReport(toPayload(values, submit));
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Brand.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Brand.colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>{isEditing ? 'Edit Report' : 'New Daily Report'}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ReportFormFields values={values} onChange={handleChange} />
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.secondaryBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() => handleSave(false)}>
          <Text style={styles.secondaryText}>Save Draft</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() => handleSave(true)}>
          {saving ? (
            <ActivityIndicator color={Brand.colors.white} />
          ) : (
            <Text style={styles.primaryText}>Submit Report</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  spacer: {
    width: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.colors.border,
    backgroundColor: Brand.colors.card,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.colors.primary,
    alignItems: 'center',
  },
  secondaryText: {
    color: Brand.colors.primary,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Brand.colors.primary,
    alignItems: 'center',
  },
  primaryText: {
    color: Brand.colors.white,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});
