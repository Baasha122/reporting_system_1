import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { LoginForm } from '@/components/auth/login-form';
import { Brand } from '@/constants/brand';
import { getDashboardRoute, useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Brand.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated && user) {
    return <Redirect href={getDashboardRoute(user.role)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
  },
});
