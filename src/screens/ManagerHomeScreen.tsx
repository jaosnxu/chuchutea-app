// CHUCHUTEA — Manager Home Screen (brand header only, data panels in future modules)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ManagerHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Привет, {user?.name?.split(' ')[0] || '...'}</Text>
      <Text style={styles.role}>Менеджер магазина</Text>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>💰 Выручка сегодня</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>👥 На смене</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>0</Text>
          <Text style={styles.statLabel}>✅ На согласовании</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>—</Text>
          <Text style={styles.statLabel}>⚠️ Склад</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Управление</Text>
      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📅</Text>
          <Text style={styles.menuText}>График смен</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>✅</Text>
          <Text style={styles.menuText}>Согласования</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Задачи</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>Склад</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Показатели</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 40 },
  role: { fontSize: 14, color: '#10b981', marginTop: 4, marginBottom: 20 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '47.5%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 14 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#10b981' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  menuList: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, overflow: 'hidden', marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { fontSize: 15, color: '#ccc', flex: 1 },
});
