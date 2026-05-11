// CHUCHUTEA — Employee Attendance Check-in Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface AttendanceRecord {
  id: string; date: string; checkIn: string; checkOut: string | null;
  status: string; lateMinutes: number; checkInSource: string;
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await authFetch(`/attendance?month=${month}`);
      if (res.ok) {
        const data: AttendanceRecord[] = await res.json();
        setRecords(data);
        const today = data.find(r => r.date && new Date(r.date).toDateString() === new Date().toDateString());
        setTodayRecord(today || null);
      }
    } catch {}
    setLoading(false);
  }

  async function checkIn() {
    setChecking(true); setStatusMsg('');
    try {
      const res = await authFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({ checkType: 'gps' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.type === 'check_in' ? '✅ Отмечен приход' : '✅ Отмечен уход');
        loadData();
      } else {
        setStatusMsg('❌ ' + (data.error || 'Ошибка'));
      }
    } catch {
      setStatusMsg('❌ Нет связи с сервером');
    }
    setChecking(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#666';
    }
  }

  function formatDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1} ${DAY_NAMES[dt.getDay()]}`;
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⏰ Отметки</Text>

      {/* Today status */}
      <View style={styles.todayCard}>
        <Text style={styles.todayTitle}>Сегодня</Text>
        {todayRecord ? (
          <View style={styles.todayDetail}>
            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Приход</Text>
              <Text style={styles.todayValue}>
                {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </Text>
            </View>
            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Уход</Text>
              <Text style={styles.todayValue}>
                {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </Text>
            </View>
            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Статус</Text>
              <Text style={[styles.todayValue, { color: getStatusColor(todayRecord.status) }]}>
                {todayRecord.status === 'present' ? '✅ На работе' : todayRecord.status === 'late' ? '⚠️ Опоздание' : todayRecord.status}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noRecord}>Ещё не отмечен</Text>
        )}
        {statusMsg ? <Text style={[styles.msg, { color: statusMsg.startsWith('✅') ? '#10b981' : '#ef4444' }]}>{statusMsg}</Text> : null}
        <TouchableOpacity
          style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
          onPress={checkIn}
          disabled={checking}
        >
          {checking ? <ActivityIndicator color="#000" /> : (
            <Text style={styles.checkBtnText}>
              {todayRecord && !todayRecord.checkOut ? '🏁 Отметиться (уход)' : '📍 Отметиться (приход)'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>История</Text>
      <View style={styles.historyList}>
        {records.map(r => (
          <View key={r.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{formatDate(r.date)}</Text>
            <Text style={styles.historyTime}>
              {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
              {' – '}
              {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </Text>
            <Text style={[styles.historyStatus, { color: getStatusColor(r.status) }]}>
              {r.status}
            </Text>
          </View>
        ))}
        {records.length === 0 && <Text style={styles.empty}>Нет записей</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 20 },
  todayCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 16, padding: 20, marginBottom: 24 },
  todayTitle: { fontSize: 14, color: '#888', marginBottom: 14 },
  todayDetail: { marginBottom: 16 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  todayLabel: { color: '#888', fontSize: 14 },
  todayValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noRecord: { color: '#555', fontSize: 14, marginBottom: 16 },
  msg: { textAlign: 'center', fontSize: 14, marginBottom: 12 },
  checkBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  historyList: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, overflow: 'hidden', marginBottom: 30 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  historyDate: { color: '#ccc', fontSize: 13, width: 80 },
  historyTime: { color: '#888', fontSize: 13, flex: 1, textAlign: 'center' },
  historyStatus: { fontSize: 13, fontWeight: '600', width: 70, textAlign: 'right' },
  empty: { color: '#555', textAlign: 'center', padding: 24 },
});
