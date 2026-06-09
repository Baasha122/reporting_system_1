import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand } from '@/constants/brand';
import { getDashboardRoute, useAuth } from '@/contexts/auth-context';

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !department.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await register(name, email, password, department);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setError(result.error ?? 'Registration failed. Please try again.');
      return;
    }

    router.replace(getDashboardRoute(result.user.role));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
               <Image
                 source={require('@/assets/images/barani-logo.png')}
                 style={styles.logo}
                 contentFit="contain"
               />
            </View>
            <Text style={styles.companyName}>BARANI HYDRAULICS INDIA{'\n'}PVT LTD</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Brand.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={department}
                onValueChange={(itemValue) => setDepartment(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Department" value="" color="#9ca3af" />
                <Picker.Item label="Machine shop" value="Machine shop" />
                <Picker.Item label="Assembly" value="Assembly" />
                <Picker.Item label="Production" value="Production" />
                <Picker.Item label="Electrical" value="Electrical" />
                <Picker.Item label="Fabrication" value="Fabrication" />
                <Picker.Item label="Design" value="Design" />
                <Picker.Item label="HR" value="HR" />
                <Picker.Item label="maintenance" value="maintenance" />
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Brand.colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.registerPrompt}>
            <Text style={styles.registerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.registerLink}>Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9', 
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    borderWidth: 1,
    borderColor: '#ff0000', 
    padding: 2,
    marginBottom: 16,
  },
  logo: {
    width: 140,
    height: 70,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003399', 
    textAlign: 'center',
    lineHeight: 28,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#003399', 
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#003399',
    fontSize: 14,
    fontWeight: '600',
  },
});
