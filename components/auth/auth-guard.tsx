import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, Alert, Platform } from 'react-native';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Brand.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== allowedRole) {
    return <Redirect href={user.role === 'hod' ? '/hod' : '/employee'} />;
  }

  return <>{children}</>;
}

export function useLogout() {
  const { logout, user } = useAuth();
  const router = useRouter();

  return async () => {
    const empIdMsg = user?.employeeId 
      ? `\n\nPlease note your Employee ID is: ${user.employeeId} for your next login.` 
      : '';
      
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm(`Are you sure you want to logout?${empIdMsg}`);
      if (confirmLogout) {
        await logout();
        router.replace('/login');
      }
    } else {
      Alert.alert(
        "Confirm Logout",
        `Are you sure you want to logout?${empIdMsg}`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              await logout();
              router.replace('/login');
            }
          }
        ]
      );
    }
  };
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.colors.background,
  },
});
