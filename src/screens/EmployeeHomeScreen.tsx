// CHUCHUTEA — Employee Home Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface DashboardData {
  points?: number;
  pendingTasks?: number;
  pendingCourses?: number;
  level?: { code: string; name: string };
  todayShift?: { start: string; end: string; type: string };
}

export default function EmployeeHomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/employee/dashboard');
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Привет, {user?.name?.split(' ')[0] || '...'}</Text>
      <Text style={styles.role}>{data.level?.code} · {data.level?.name}</Text>

      {data.todayShift && (
        <View style={styles.shiftCard}>
          <Text style={styles.shiftTitle}>🕐 Сегодняшняя смена</Text>
          <Text style={styles.shiftTime}>{data.todayShift.start} – {data.todayShift.end}</Text>
          <Text style={styles.shiftType}>{data.todayShift.type === 'morning' ? 'Утренняя' : data.todayShift.type === 'evening' ? 'Вечерняя' : data.todayShift.type}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.points || 0}</Text>
          <Text style={styles.statLabel}>💰 Баллы</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{data.pendingTasks || 0}</Text>
          <Text style={styles.statLabel}>📋 Задачи</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#60a5fa' }]}>{data.pendingCourses || 0}</Text>
          <Text style={styles.statLabel}>📚 Курсы</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Быстрые действия</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Сканировать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionText}>Задачи</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={styles.actionText}>Обучение</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>⏰</Text>
          <Text style={styles.actionText}>Отметиться</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingTop: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 40 },
  role: { fontSize: 14, color: '#10b981', marginTop: 4, marginBottom: 20 },
  shiftCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#10b98130', borderRadius: 14, padding: 16, marginBottom: 16 },
  shiftTitle: { fontSize: 13, color: '#888', marginBottom: 6 },
  shiftTime: { fontSize: 20, fontWeight: '700', color: '#10b981' },
  shiftType: { fontSize: 12, color: '#666', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#10b981' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  actionBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 18, width: '47.5%', alignItems: 'center' },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { fontSize: 13, color: '#aaa' },
});
