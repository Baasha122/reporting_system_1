import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (itemValue: string) => void;
  items: { label: string; value: string; color?: string }[];
  placeholder?: string;
  style?: any;
}

export function CustomPicker({ selectedValue, onValueChange, items, placeholder, style }: CustomPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  if (Platform.OS === 'web') {
    const flatStyle = StyleSheet.flatten(style) || {};
    return (
      <select
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 50,
          border: 'none',
          backgroundColor: 'transparent',
          outline: 'none',
          fontSize: 15,
          color: '#1F2937',
          padding: '0 8px',
          cursor: 'pointer',
          ...flatStyle
        }}
      >
        {placeholder && <option value="" style={{ color: '#9CA3AF' }}>{placeholder}</option>}
        {items.map((item, idx) => (
          <option key={idx} value={item.value} style={{ color: item.color || '#1F2937' }}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  // Cross-Platform Fallback using Modal for Android & iOS
  const selectedItem = items.find((i) => i.value === selectedValue);

  // Extract text styles to apply to the Text component
  const flattenedStyle = StyleSheet.flatten(style || {});
  const textStyles = {
    color: flattenedStyle.color || '#1F2937',
    fontSize: flattenedStyle.fontSize || 14,
    fontWeight: flattenedStyle.fontWeight,
    fontFamily: flattenedStyle.fontFamily,
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.iosPickerContainer, style, { color: undefined, fontSize: undefined, fontWeight: undefined, fontFamily: undefined }]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.iosPickerText, textStyles, !selectedItem && {color: '#9CA3AF'}]} numberOfLines={1}>
            {selectedItem ? selectedItem.label : (placeholder || 'Select Option')}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>
      
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {placeholder && (
                <TouchableOpacity 
                  style={styles.optionItem} 
                  onPress={() => { onValueChange(''); setModalVisible(false); }}
                >
                  <Text style={[styles.optionText, { color: '#9CA3AF' }]}>{placeholder}</Text>
                </TouchableOpacity>
              )}
              {items.map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.optionItem, selectedValue === item.value && styles.optionItemSelected]} 
                  onPress={() => { onValueChange(item.value); setModalVisible(false); }}
                >
                  <Text style={[styles.optionText, selectedValue === item.value && styles.optionTextSelected, item.color ? { color: item.color } : null]}>
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Ionicons name="checkmark" size={20} color="#0056FF" />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iosPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iosPickerText: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#374151',
  },
  modalClose: {
    color: '#0056FF',
    fontWeight: '600',
    fontSize: 16,
  },
  optionsList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#0056FF',
    fontWeight: '600',
  }
});
