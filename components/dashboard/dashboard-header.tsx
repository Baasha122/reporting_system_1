import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { User } from '@/types/auth';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
  badge?: string;
}

export function DashboardHeader({ user, onLogout, badge }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
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
        <View style={styles.info}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>
            {user.name} {user.employeeId ? `(${user.employeeId})` : ''}
          </Text>
          <Text style={styles.meta}>
            {user.designation} · {user.department}
          </Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={onLogout} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={Brand.colors.primary} />
        </Pressable>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Brand.colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  name: {
    color: Brand.colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: Brand.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Brand.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
