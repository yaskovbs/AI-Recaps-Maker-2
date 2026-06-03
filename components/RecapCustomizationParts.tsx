// Reusable atoms for RecapCustomizationPanel
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ label }: { label: string }) {
  return <Text style={ps.sectionTitle}>{label}</Text>;
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

export function TagInput({
  tags, placeholder, onAdd, onRemove,
}: {
  tags: string[];
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) onAdd(trimmed);
    setValue('');
  };

  return (
    <View>
      <View style={ps.tagInputRow}>
        <TextInput
          style={ps.tagTextInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#6B6B7F"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={ps.addButton} onPress={handleAdd}>
          <MaterialIcons name="add" size={20} color="#0a0a14" />
        </Pressable>
      </View>
      {tags.length > 0 && (
        <View style={ps.chipWrap}>
          {tags.map(tag => (
            <View key={tag} style={ps.tagChip}>
              <Text style={ps.tagChipText}>{tag}</Text>
              <Pressable onPress={() => onRemove(tag)} hitSlop={6}>
                <MaterialIcons name="close" size={14} color="#9B9BAF" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── ToggleChips ──────────────────────────────────────────────────────────────

export function ToggleChips({
  options, selected, onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={ps.chipWrap}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            style={[ps.toggleChip, active && ps.toggleChipActive]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[ps.toggleChipText, active && ps.toggleChipTextActive]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── SelectRow ────────────────────────────────────────────────────────────────

export function SelectRow<T extends string>({
  options, value, labels, onChange,
}: {
  options: T[];
  value: T;
  labels?: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <View style={ps.selectRow}>
      {options.map(opt => {
        const active = value === opt;
        const label = labels ? labels[opt] : opt.charAt(0).toUpperCase() + opt.slice(1);
        return (
          <Pressable
            key={opt}
            style={[ps.selectBtn, active && ps.selectBtnActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[ps.selectBtnText, active && ps.selectBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

export const ps = StyleSheet.create({
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#E8E8F0',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  tagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tagTextInput: {
    flex: 1, backgroundColor: '#242438', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, color: '#E8E8F0', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  addButton: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: '#00D4FF',
    justifyContent: 'center', alignItems: 'center',
  },
  chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#242438',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
  },
  tagChipText: { fontSize: 13, color: '#00D4FF', fontWeight: '500' },
  toggleChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#242438', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleChipActive:     { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: '#00D4FF' },
  toggleChipText:       { fontSize: 13, color: '#9B9BAF', fontWeight: '500', textTransform: 'capitalize' },
  toggleChipTextActive: { color: '#00D4FF', fontWeight: '700' },
  selectRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectBtn: {
    flex: 1, minWidth: 70, paddingVertical: 9, borderRadius: 8, backgroundColor: '#242438',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center',
  },
  selectBtnActive:     { backgroundColor: 'rgba(178,75,243,0.2)', borderColor: '#B24BF3' },
  selectBtnText:       { fontSize: 13, color: '#9B9BAF', fontWeight: '600' },
  selectBtnTextActive: { color: '#B24BF3', fontWeight: '700' },
});
