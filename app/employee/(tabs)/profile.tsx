import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogout } from '@/components/auth/auth-guard';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';

export default function EmployeeProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const handleLogout = useLogout();

  if (!user) return null;

  const fields = [
    { label: 'Employee ID', value: user.employeeId, icon: 'id-card-outline' as const },
    { label: 'Email', value: user.email, icon: 'mail-outline' as const },
    { label: 'Department', value: user.department, icon: 'business-outline' as const },
    { label: 'Designation', value: user.designation, icon: 'briefcase-outline' as const },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>Employee</Text>
      </View>

      {fields.map((field) => (
        <View key={field.label} style={styles.fieldRow}>
          <Ionicons name={field.icon} size={20} color={Brand.colors.primary} />
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Brand.colors.white} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.colors.text,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: Brand.colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.colors.text,
  },
  role: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    marginTop: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Brand.colors.border,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.colors.text,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  logoutText: {
    color: Brand.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
