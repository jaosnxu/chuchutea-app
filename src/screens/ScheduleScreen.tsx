// CHUCHUTEA — Employee Schedule Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface ScheduleEntry {
  id: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  status: string;
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '☀️ Утро', afternoon: '🌤 День', evening: '🌙 Вечер', night: '🌃 Ночь',
};
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<[string, ScheduleEntry | null][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/schedules?employeeId=' + (user?.id || ''));
        if (res.ok) {
          const data: ScheduleEntry[] = await res.json();
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - (today.getDay() || 7) + 1);
          const pairs: [string, ScheduleEntry | null][] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(monday); d.setDate(monday.getDate() + i);
            const key = d.toISOString().split('T')[0];
            pairs.push([key, data.find(s => s.date.startsWith(key)) || null]);
          }
          setWeekData(pairs);
        }
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Мой график</Text>

      <View style={styles.weekGrid}>
        {weekData.map(([key, entry]) => {
          const d = new Date(key + 'T00:00:00');
          const dayName = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const isToday = new Date().toISOString().split('T')[0] === key;

          return (
            <View key={key} style={[styles.dayCard, isToday && styles.dayCardToday]}>
              <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{dayName}</Text>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{dayNum}</Text>
              {entry ? (
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftLabel}>{entry.shiftType === 'morning' ? '☀️' : entry.shiftType === 'evening' ? '🌙' : '🕐'}</Text>
                  <Text style={styles.shiftTime}>{entry.startTime}</Text>
                  <Text style={styles.shiftTime}>{entry.endTime}</Text>
                </View>
              ) : (
                <Text style={styles.dayOff}>—</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Запросить обмен</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🏖️</Text>
          <Text style={styles.actionText}>Отпуск</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 20 },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  dayCard: {
    width: '13.5%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center',
  },
  dayCardToday: { borderColor: '#10b981', backgroundColor: '#10b98110' },
  dayName: { fontSize: 11, color: '#666', marginBottom: 2 },
  dayNameToday: { color: '#10b981' },
  dayNum: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  dayNumToday: { color: '#10b981' },
  shiftInfo: { alignItems: 'center' },
  shiftLabel: { fontSize: 14 },
  shiftTime: { fontSize: 9, color: '#888', textAlign: 'center' },
  dayOff: { fontSize: 9, color: '#444' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  actionBtn: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 18, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionText: { fontSize: 13, color: '#aaa' },
});
