import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, Image, StyleSheet, Text, View } from 'react-native';

import { useLogout } from '@/components/auth/auth-guard';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';

const EMPLOYEE_NAV_ITEMS = [
  { name: 'Home', path: '/employee', icon: 'home' as const },
  { name: 'History', path: '/employee/history', icon: 'time-outline' as const },
];

const HOD_NAV_ITEMS = [
  { name: 'Dashboard', path: '/hod', icon: 'home' as const },
  { name: 'Employee Search', path: '/hod/search', icon: 'people-outline' as const },
  { name: 'Reports', path: '/hod/reports', icon: 'bar-chart-outline' as const },
  { name: 'Monthly Reports', path: '/hod/monthly', icon: 'calendar-outline' as const },
  { name: 'History', path: '/hod/history', icon: 'time-outline' as const },
  { name: 'Settings', path: '/hod/settings', icon: 'settings-outline' as const },
];

export function Sidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const handleLogout = useLogout();
  
  const navItems = user?.role === 'hod' ? HOD_NAV_ITEMS : EMPLOYEE_NAV_ITEMS;

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    // If we're at the root of the area
    if (path === '/hod' || path === '/employee') {
      return pathname === path || pathname === path + '/';
    }
    return pathname.startsWith(path);
  };

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link href={item.path as any} key={item.name} asChild>
              <Pressable style={styles.mobileNavItem}>
                <Ionicons
                  name={active && item.icon.endsWith('-outline') ? (item.icon.replace('-outline', '') as any) : item.icon}
                  size={24}
                  color={active ? Brand.colors.primary : Brand.colors.textSecondary}
                />
                <Text style={StyleSheet.flatten([styles.mobileNavText, active && styles.navTextActive])} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            </Link>
          );
        })}
        <Pressable style={styles.mobileNavItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Brand.colors.textSecondary} />
          <Text style={styles.mobileNavText} numberOfLines={1}>Logout</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/barani-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link href={item.path as any} key={item.name} asChild>
              <Pressable style={StyleSheet.flatten([styles.navItem, active && styles.navItemActive])}>
                <Ionicons
                  name={active && item.icon.endsWith('-outline') ? (item.icon.replace('-outline', '') as any) : item.icon}
                  size={22}
                  color={active ? Brand.colors.primary : Brand.colors.textSecondary}
                  style={styles.icon}
                />
                <Text style={StyleSheet.flatten([styles.navText, active && styles.navTextActive])}>
                  {item.name}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <View style={styles.logoutContainer}>
        <Pressable style={styles.navItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Brand.colors.textSecondary} style={styles.icon} />
          <Text style={styles.navText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: Brand.colors.card,
    borderRightWidth: 1,
    borderRightColor: Brand.colors.border,
    height: '100%',
  },
  logoContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Brand.colors.border,
    height: 80, // Match header height
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 40,
  },
  navContainer: {
    padding: 16,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#F0F5FF', // Light blue background for active
    borderLeftWidth: 4,
    borderLeftColor: Brand.colors.primary,
    paddingLeft: 12, // Adjust padding to account for border
  },
  icon: {
    marginRight: 12,
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: Brand.colors.textSecondary,
  },
  navTextActive: {
    color: Brand.colors.primary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.colors.border,
  },
  mobileContainer: {
    flexDirection: 'row',
    backgroundColor: Brand.colors.card,
    borderTopWidth: 1,
    borderTopColor: Brand.colors.border,
    paddingBottom: 24, // Safe area for modern phones
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  mobileNavText: {
    fontSize: 10,
    color: Brand.colors.textSecondary,
    textAlign: 'center',
  },
});
