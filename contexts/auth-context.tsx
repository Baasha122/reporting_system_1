import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (
    name: string,
    email: string,
    password: string,
    department: string,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        let userRole = data.role as UserRole;
        
        // Auto-Correction for active sessions: If ID ends with HOD but role is wrong, force upgrade
        // Also check email because the database trigger might have generated a random EMP_ ID instead of using the HOD ID!
        const isHodEmail = data.email && data.email.toLowerCase().includes('hod@barani.com');
        const isHodId = data.employee_id && data.employee_id.toUpperCase().endsWith('HOD');
        
        if (isHodId || isHodEmail) {
          userRole = 'hod';
          
          // Determine the correct department from the prefix
          let prefix = '';
          if (isHodId) prefix = data.employee_id.substring(0, 2).toUpperCase();
          else if (isHodEmail) prefix = data.email.substring(0, 2).toUpperCase();
          
          const HOD_MAP: Record<string, string> = {
            'MS': 'Machine shop', 'AS': 'Assembly', 'PR': 'Production',
            'EL': 'Electrical', 'FA': 'Fabrication', 'DE': 'Design',
            'HR': 'HR', 'MA': 'maintenance'
          };
          
          const correctDept = HOD_MAP[prefix] || data.department;

          const updates: any = {};
          if (data.role !== 'hod') updates.role = 'hod';
          if (data.department !== correctDept) updates.department = correctDept;
          
          if (!isHodId && isHodEmail) {
            updates.employee_id = `${prefix}HOD`;
            data.employee_id = `${prefix}HOD`;
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('id', data.id);
            data.department = correctDept;
          }
        }

        setUser({
          id: data.id,
          employeeId: data.employee_id,
          name: data.name,
          email: data.email,
          role: userRole,
          department: data.department,
          designation: data.designation,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (identifier: string, password: string, rememberMe: boolean) => {
    try {
      let email = identifier;
      let supabasePassword = password;

      // HOD Magic Login Intercept (e.g. MSHOD with password MS123)
      const identUpper = identifier.toUpperCase();
      if (identUpper.endsWith('HOD') && identUpper.length === 5) {
        const prefix = identUpper.substring(0, 2);
        const expectedPassword = `${prefix}123`;
        
        if (password.toUpperCase() === expectedPassword) {
          // Supabase requires passwords to be at least 6 characters.
          // Since MS123 is 5 characters, we pad it behind the scenes!
          supabasePassword = `${expectedPassword}_SECURE`;
          
          const HOD_MAP: Record<string, string> = {
            'MS': 'Machine shop',
            'AS': 'Assembly',
            'PR': 'Production',
            'EL': 'Electrical',
            'FA': 'Fabrication',
            'DE': 'Design',
            'HR': 'HR',
            'MA': 'maintenance'
          };
          
          if (HOD_MAP[prefix]) {
             const hodEmail = `${prefix.toLowerCase()}hod@barani.com`;
             email = hodEmail;
             
             // Check if HOD account already exists
             const { data: profiles } = await supabase
                .from('profiles')
                .select('email')
                .ilike('employee_id', identUpper)
                .limit(1);
             
             // If not found, auto-create the HOD account seamlessly
             if (!profiles || profiles.length === 0) {
               const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                 email: hodEmail,
                 password: supabasePassword,
                 options: {
                   data: {
                     employee_id: identUpper,
                     department: HOD_MAP[prefix],
                     name: `${HOD_MAP[prefix]} Head`,
                     role: 'hod',
                   }
                 }
               });
               
               if (!signUpError && signUpData.user) {
                  // Manually insert the profile row in case there is no DB trigger
                  await supabase.from('profiles').insert([{
                       id: signUpData.user.id,
                       employee_id: identUpper,
                       department: HOD_MAP[prefix],
                       name: `${HOD_MAP[prefix]} Head`,
                       role: 'hod',
                       email: hodEmail
                  }]);
               }
             }
          }
        }
      }

      // If identifier is not an email (and wasn't handled by HOD intercept), assume it's an Employee ID and look up their real email
      if (!email.includes('@')) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('employee_id', identifier)
          .limit(1);

        if (profileError || !profiles || profiles.length === 0) {
          return { 
            success: false, 
            error: 'Employee ID not found. Please check your ID or try using your registered email address.' 
          };
        }
        
        email = profiles[0].email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: supabasePassword,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Account created! However, Email Confirmations are enabled in your Supabase project. Please turn off "Confirm email" in Supabase Auth settings to use this feature.'
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      if (data.user) {
        // Fetch profile to return it
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If profile is missing (no trigger fired), and it's a magic HOD account, manually rescue it!
        if (!profile && email.toLowerCase().includes('hod@barani.com')) {
          const prefix = email.substring(0, 2).toUpperCase();
          const HOD_MAP: Record<string, string> = {
            'MS': 'Machine shop', 'AS': 'Assembly', 'PR': 'Production',
            'EL': 'Electrical', 'FA': 'Fabrication', 'DE': 'Design',
            'HR': 'HR', 'MA': 'maintenance'
          };
          const correctDept = HOD_MAP[prefix] || 'Unknown';
          const rescueProfile = {
            id: data.user.id,
            employee_id: `${prefix}HOD`,
            name: `${correctDept} Head`,
            department: correctDept,
            role: 'hod',
            email: email
          };
          await supabase.from('profiles').insert([rescueProfile]);
          profile = rescueProfile;
        }

        if (profile) {
          let userRole = profile.role as UserRole;
          
          // Auto-Correction: If they registered manually, their role might be 'employee'. 
          // If their ID ends with HOD, forcefully upgrade them to HOD!
          const isHodEmail = profile.email && profile.email.toLowerCase().includes('hod@barani.com');
          const isHodId = profile.employee_id && profile.employee_id.toUpperCase().endsWith('HOD');
          
          if (isHodId || isHodEmail) {
            userRole = 'hod';
            
            let prefix = '';
            if (isHodId) prefix = profile.employee_id.substring(0, 2).toUpperCase();
            else if (isHodEmail) prefix = profile.email.substring(0, 2).toUpperCase();
            
            const HOD_MAP: Record<string, string> = {
              'MS': 'Machine shop', 'AS': 'Assembly', 'PR': 'Production',
              'EL': 'Electrical', 'FA': 'Fabrication', 'DE': 'Design',
              'HR': 'HR', 'MA': 'maintenance'
            };
            
            const correctDept = HOD_MAP[prefix] || profile.department;
            const updates: any = {};
            
            if (profile.role !== 'hod') updates.role = 'hod';
            if (profile.department !== correctDept) updates.department = correctDept;
            
            if (!isHodId && isHodEmail) {
              updates.employee_id = `${prefix}HOD`;
              profile.employee_id = `${prefix}HOD`; // Update local copy
            }
            
            if (Object.keys(updates).length > 0) {
              await supabase.from('profiles').update(updates).eq('id', data.user.id);
              profile.department = correctDept;
            }
          }

          const userObj: User = {
            id: profile.id,
            employeeId: profile.employee_id,
            name: profile.name,
            email: profile.email,
            role: userRole,
            department: profile.department,
            designation: profile.designation,
          };
          
          // Forcefully update local state instantly to prevent any race condition with the router!
          setUser(userObj);
          
          return { success: true, user: userObj };
        }
      }
      return { success: false, error: 'User profile not found' };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Unable to sign in. Please check your credentials.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, department: string) => {
    try {
      // 0. Generate department-specific employee ID
      let prefix = 'EMP';
      if (department === 'Machine shop') prefix = 'MS';
      else if (department === 'Assembly') prefix = 'AS';
      else if (department === 'Production') prefix = 'PR';
      else if (department === 'Electrical') prefix = 'EL';
      else if (department === 'Fabrication') prefix = 'FA';
      else if (department === 'Design') prefix = 'DE';
      else if (department === 'HR') prefix = 'HR';
      else if (department === 'maintenance') prefix = 'MA';

      // Find highest existing ID for this prefix
      const { data: latestUsers } = await supabase
        .from('profiles')
        .select('employee_id')
        .like('employee_id', `${prefix}%`)
        .not('employee_id', 'ilike', '%HOD') // Ignore the magic HOD accounts
        .order('employee_id', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (latestUsers && latestUsers.length > 0) {
        const lastId = latestUsers[0].employee_id;
        const numPart = lastId.substring(prefix.length);
        const parsedNum = parseInt(numPart, 10);
        if (!isNaN(parsedNum)) {
          nextNum = parsedNum + 1;
        }
      }

      const generatedEmployeeId = `${prefix}${nextNum.toString().padStart(3, '0')}`;

      // 1. Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            employee_id: generatedEmployeeId,
            department: department,
            name: name,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Wait a tiny bit for the DB trigger to finish creating the profile row
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if the profile was created by a trigger
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Trigger didn't run, manually insert the profile
          await supabase.from('profiles').insert([{
            id: data.user.id,
            name,
            department,
            employee_id: generatedEmployeeId,
            role: 'employee',
            email
          }]);
        } else {
          // Trigger ran, just update it
          await supabase
            .from('profiles')
            .update({
              name,
              department,
              employee_id: generatedEmployeeId,
            })
            .eq('id', data.user.id);
        }

        // 4. Fetch the final profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const userObj: User = {
            id: profile.id,
            employeeId: profile.employee_id,
            name: profile.name,
            email: profile.email,
            role: profile.role as UserRole,
            department: profile.department,
            designation: profile.designation,
          };
          // Set user manually if they aren't auto-logged in by the listener yet
          setUser(userObj);
          return { success: true, user: userObj };
        }
      }
      return { success: false, error: 'User profile not found after registration' };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Unable to register. Please try again.',
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getDashboardRoute(role: UserRole): '/employee' | '/hod' {
  return role === 'hod' ? '/hod' : '/employee';
}
