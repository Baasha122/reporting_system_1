import { Redirect } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { RegisterForm } from '@/components/auth/register-form';
import { getDashboardRoute, useAuth } from '@/contexts/auth-context';

export default function RegisterScreen() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Redirect href={getDashboardRoute(user.role)} />;
  }

  return (
    <View style={styles.container}>
      <RegisterForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
});
