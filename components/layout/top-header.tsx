import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/brand';

export function TopHeader({ subtitle }: { subtitle?: string }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = Platform.OS !== 'web' || width < 1024;

  return (
    <View style={[styles.container, isMobile && { height: 60 + insets.top, paddingTop: insets.top, paddingHorizontal: 16 }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, isMobile && { fontSize: 16 }]}>REPORTING SYSTEM</Text>
        {subtitle && !isMobile && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      <TouchableOpacity style={styles.profileContainer}>
        <View style={styles.profileTextContainer}>
          <Text style={styles.profileName}>
            {user?.name || 'John Doe'} {user?.employeeId ? `(${user.employeeId})` : ''}
          </Text>
          {!isMobile && (
            <Text style={styles.profileRole}>
              {user?.role === 'hod' ? 'Head of Department' : 'Employee'}
              {user?.department ? ` • ${user.department}` : ''}
            </Text>
          )}
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color={Brand.colors.primary} />
        </View>
        {!isMobile && <Ionicons name="chevron-down" size={16} color={Brand.colors.textSecondary} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: Brand.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.colors.primaryDark,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileTextContainer: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  profileRole: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '500',
    color: Brand.colors.text,
  },
});
