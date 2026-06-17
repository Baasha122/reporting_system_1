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
import { CustomPicker } from '@/components/ui/custom-picker';

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!result.success) {
      setError(result.error ?? 'Registration failed. Please try again.');
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.scrollContent}>
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

            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark-circle" size={64} color={Brand.colors.success} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Brand.colors.text, marginTop: 16, textAlign: 'center' }}>
                Registration Submitted!
              </Text>
              <Text style={{ fontSize: 16, color: Brand.colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 24 }}>
                Your account has been created successfully. Please wait for your Head of Department to approve your account before you can log in.
              </Text>
            </View>

            <Pressable
              style={styles.loginButton}
              onPress={() => router.replace('/login')}>
              <Text style={styles.loginButtonText}>Back to Login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
            <View style={[styles.pickerContainer, { height: 48 }]}>
              <CustomPicker
                selectedValue={department}
                onValueChange={(itemValue) => setDepartment(itemValue)}
                style={styles.picker}
                placeholder="Select Department"
                items={[
                  { label: "Machine shop", value: "Machine shop" },
                  { label: "Assembly", value: "Assembly" },
                  { label: "Production", value: "Production" },
                  { label: "Electrical", value: "Electrical" },
                  { label: "Fabrication", value: "Fabrication" },
                  { label: "Design", value: "Design" },
                  { label: "HR", value: "HR" },
                  { label: "maintenance", value: "maintenance" }
                ]}
              />
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
    height: 50,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    height: 50,
  },
  picker: {
    width: '100%',
    height: 50,
    minHeight: 50,
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 8,
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
