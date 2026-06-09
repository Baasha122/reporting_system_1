import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { ReportFormData } from '@/types/report';

interface ReportFormFieldsProps {
  values: ReportFormData;
  onChange: (field: keyof ReportFormData, value: string) => void;
  disabled?: boolean;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function ReportFormFields({ values, onChange, disabled = false }: ReportFormFieldsProps) {
  return (
    <View style={styles.container}>
      <Field label="Report Date">
        <View style={styles.inputWrap}>
          <Ionicons name="calendar-outline" size={18} color={Brand.colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={values.report_date}
            onChangeText={(v) => onChange('report_date', v)}
            placeholder="YYYY-MM-DD"
            editable={!disabled}
          />
        </View>
      </Field>

      <Field label="Task Name">
        <TextInput
          style={styles.textAreaSingle}
          value={values.task_name}
          onChangeText={(v) => onChange('task_name', v)}
          placeholder="e.g. Hydraulic Press Calibration"
          editable={!disabled}
        />
      </Field>

      <Field label="Work Description">
        <TextInput
          style={styles.textArea}
          value={values.work_description}
          onChangeText={(v) => onChange('work_description', v)}
          placeholder="Describe the work completed today..."
          multiline
          textAlignVertical="top"
          editable={!disabled}
        />
      </Field>

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Hours Worked">
            <TextInput
              style={styles.textAreaSingle}
              value={values.hours_worked}
              onChangeText={(v) => onChange('hours_worked', v)}
              placeholder="8"
              keyboardType="decimal-pad"
              editable={!disabled}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Completion %">
            <TextInput
              style={styles.textAreaSingle}
              value={values.completion_percentage}
              onChangeText={(v) => onChange('completion_percentage', v)}
              placeholder="100"
              keyboardType="number-pad"
              editable={!disabled}
            />
          </Field>
        </View>
      </View>

      <Field label="Challenges Faced (optional)">
        <TextInput
          style={styles.textArea}
          value={values.challenges_faced}
          onChangeText={(v) => onChange('challenges_faced', v)}
          placeholder="Any issues or blockers..."
          multiline
          textAlignVertical="top"
          editable={!disabled}
        />
      </Field>

      <Field label="Evidence URL (optional)">
        <TextInput
          style={styles.textAreaSingle}
          value={values.evidence_url}
          onChangeText={(v) => onChange('evidence_url', v)}
          placeholder="Link to photo or document"
          autoCapitalize="none"
          editable={!disabled}
        />
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: Brand.colors.card,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.colors.text,
  },
  textAreaSingle: {
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.colors.text,
    backgroundColor: Brand.colors.card,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Brand.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.colors.text,
    backgroundColor: Brand.colors.card,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
});
