import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

export default function EmployeeTasksScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>My Tasks</Text>
      <View style={styles.placeholder}>
        <Ionicons name="construct-outline" size={48} color={Brand.colors.primary} />
        <Text style={styles.placeholderTitle}>Task Management</Text>
        <Text style={styles.placeholderText}>Create, update, and track your daily tasks here.</Text>
      </View>
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
    marginBottom: 20,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  placeholderText: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
