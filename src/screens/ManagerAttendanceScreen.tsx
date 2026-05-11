// CHUCHUTEA — Manager Attendance Dashboard
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { authFetch } from '../contexts/AuthContext';

interface EmpStatus {
  id: string; firstNameRu: string; lastNameRu: string; role: string;
  status: string; scheduledStart: string | null; scheduledEnd: string | null;
  checkIn: string | null; checkOut: string | null; lateMinutes: number;
}

export default function ManagerAttendanceScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await authFetch('/attendance/summary?orgId=s-001&type=today');
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  function statusIcon(s: string) {
    switch (s) {
      case 'working': return '🟢';
      case 'done': return '✅';
      case 'late': return '🟡';
      case 'absent': return '🔴';
      case 'present': return '🟢';
      default: return '⚫';
    }
  }
  function statusLabel(s: string) {
    switch (s) {
      case 'working': return 'На смене';
      case 'done': return 'Завершил';
      case 'late': return 'Опоздал';
      case 'absent': return 'Отсутствует';
      case 'present': return 'Присутствует';
      default: return 'Выходной';
    }
  }
  function statusColor(s: string) {
    switch (s) {
      case 'working': case 'done': case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#666';
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#10b981" />}>
      <Text style={styles.title}>👥 Посещаемость</Text>
      <Text style={styles.subtitle}>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{data?.present || 0}</Text>
          <Text style={styles.statLabel}>На смене</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{data?.late || 0}</Text>
          <Text style={styles.statLabel}>Опоздали</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{data?.absent || 0}</Text>
          <Text style={styles.statLabel}>Отсутствуют</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#666' }]}>
          <Text style={[styles.statValue, { color: '#666' }]}>{data?.off || 0}</Text>
          <Text style={styles.statLabel}>Выходной</Text>
        </View>
      </View>

      {/* Per-employee list */}
      <Text style={styles.sectionTitle}>Сотрудники</Text>
      <View style={styles.list}>
        {(data?.employees || []).map((emp: EmpStatus) => (
          <View key={emp.id} style={styles.row}>
            <View style={styles.empCol}>
              <Text style={styles.empName}>{emp.firstNameRu} {emp.lastNameRu}</Text>
              <Text style={styles.empRole}>{emp.role === 'store_manager' ? 'Менеджер' : 'Сотрудник'}</Text>
            </View>
            <View style={styles.statusCol}>
              <Text style={[styles.statusBadge, { color: statusColor(emp.status) }]}>
                {statusIcon(emp.status)} {statusLabel(emp.status)}
              </Text>
              {emp.scheduledStart && (
                <Text style={styles.timeText}>
                  {emp.scheduledStart}–{emp.scheduledEnd}
                </Text>
              )}
              {emp.checkIn && (
                <Text style={styles.timeText}>
                  Пришёл: {new Date(emp.checkIn).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {emp.lateMinutes > 0 && (
                <Text style={styles.lateText}>Опоздание: {emp.lateMinutes} мин</Text>
              )}
            </View>
          </View>
        ))}
        {(data?.employees || []).length === 0 && <Text style={styles.empty}>Нет данных</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12,
    borderLeftWidth: 3, padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 10 },
  list: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, overflow: 'hidden', marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  empCol: { flex: 1 },
  empName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empRole: { color: '#666', fontSize: 12, marginTop: 2 },
  statusCol: { alignItems: 'flex-end' },
  statusBadge: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  timeText: { color: '#888', fontSize: 11 },
  lateText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  empty: { color: '#555', textAlign: 'center', padding: 24 },
});
