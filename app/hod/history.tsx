import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export default function ClientHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.department) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      // Fetch projects filtered by the HOD's department
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('department', user?.department)
        .order('id', { ascending: false });

      if (error) throw error;
      
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading client history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client History</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : (
        <View style={styles.card}>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No client records found.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="briefcase" size={24} color={Brand.colors.primary} />
                </View>
                <View style={styles.content}>
                  <View style={styles.contentHeader}>
                    <Text style={styles.projectName}>{item.projectname}</Text>
                    <Text style={styles.timeText}>{item.datetime ? new Date(item.datetime).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={styles.detailsText}>
                    Project ID: <Text style={{fontWeight: '700'}}>{item.projectid}</Text>
                  </Text>
                  <Text style={styles.detailsText}>
                    Client/Customer: {item.customername}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.colors.text, marginBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    padding: 24,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  timeText: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
  detailsText: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: Brand.colors.textSecondary,
    padding: 40,
  },
});
