import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ReportStatus } from '@/types/report';
import { REPORT_STATUS_COLORS, REPORT_STATUS_LABELS } from '@/utils/report-status';

interface StatusBadgeProps {
  status: ReportStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = REPORT_STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, { color }]}>{REPORT_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
