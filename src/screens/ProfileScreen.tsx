// CHUCHUTEA — Profile Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/employee/dashboard');
        if (res.ok) setData(await res.json());
      } catch {}
    })();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.name || '...'}</Text>
        <Text style={styles.levelText}>
          {data.level?.code} · {data.level?.name || '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 ПОКАЗАТЕЛИ</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Баллы</Text>
          <Text style={styles.rowValue}>{data.points || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Активные задачи</Text>
          <Text style={styles.rowValue}>{data.pendingTasks || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Курсы не пройдены</Text>
          <Text style={styles.rowValue}>{data.pendingCourses || 0}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 ИНФОРМАЦИЯ</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Роль</Text>
          <Text style={styles.rowValue}>{user?.role || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Организация</Text>
          <Text style={styles.rowValue}>{user?.orgId || '—'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      <Text style={styles.version}>CHUCHUTEA v0.1.0 · M2</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { alignItems: 'center', paddingVertical: 30, paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b98120', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10b98140' },
  avatarText: { fontSize: 36 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  levelText: { fontSize: 13, color: '#10b981' },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  cardTitle: { fontSize: 11, color: '#666', marginBottom: 12, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  rowLabel: { fontSize: 14, color: '#ccc' },
  rowValue: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  logoutBtn: { marginHorizontal: 16, marginTop: 20, padding: 14, backgroundColor: '#450a0a', borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fca5a5', fontSize: 15 },
  version: { textAlign: 'center', color: '#333', fontSize: 12, marginVertical: 24 },
});
