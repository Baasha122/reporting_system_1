import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export default function EmployeesScreen() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Employees Directory</Text>
      <Text style={styles.subtitle}>This section will list all employees.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Brand.colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Brand.colors.textSecondary,
  },
});
