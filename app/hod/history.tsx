import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import { DailyReport } from '@/types/report';

export default function HistoryScreen() {
  const [history, setHistory] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          employee:profiles(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setHistory((data || []).map(item => ({
        ...item,
        employee: Array.isArray(item.employee) ? item.employee[0] : item.employee
      })) as DailyReport[]);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (status: string) => {
    switch (status) {
      case 'approved': return { name: 'checkmark-circle', color: Brand.colors.success };
      case 'rejected': return { name: 'close-circle', color: Brand.colors.error };
      case 'submitted': return { name: 'arrow-up-circle', color: Brand.colors.warning };
      default: return { name: 'document-text', color: Brand.colors.textSecondary };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audit History</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.colors.primary} />
        </View>
      ) : (
        <View style={styles.timelineCard}>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No history records found.</Text>
            }
            renderItem={({ item, index }) => {
              const icon = getActionIcon(item.status);
              return (
                <View style={styles.timelineItem}>
                  {/* Timeline connector line */}
                  {index !== history.length - 1 && <View style={styles.timelineLine} />}
                  
                  <View style={styles.iconContainer}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                  </View>
                  
                  <View style={styles.content}>
                    <View style={styles.contentHeader}>
                      <Text style={styles.actionText}>
                        Report <Text style={{fontWeight: '700'}}>#{item.id}</Text> was marked as {item.status}
                      </Text>
                      <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.detailsText}>
                      By {item.employee?.name || 'Unknown User'} for task: "{item.task_name}"
                    </Text>
                  </View>
                </View>
              );
            }}
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
  timelineCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    padding: 24,
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11, // half of icon width
    top: 24,
    bottom: -24,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  iconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    zIndex: 1,
    marginRight: 16,
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: Brand.colors.text,
  },
  timeText: {
    fontSize: 12,
    color: Brand.colors.textSecondary,
  },
  detailsText: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: Brand.colors.textSecondary,
    padding: 40,
  },
});
