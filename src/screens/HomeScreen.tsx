// CHUCHUTEA — Home Screen (placeholder for M2)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍵 CHUCHUTEA</Text>
        <Text style={styles.greeting}>Привет, {user?.name || '...'}</Text>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Смена</Text>
          <Text style={styles.cardValue}>--:--</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Задачи</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Баллы</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Курсы</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>
      </View>

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
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>Профиль</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#10b981', marginBottom: 4 },
  greeting: { fontSize: 14, color: '#888' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14,
    padding: 16, width: '47%',
  },
  cardTitle: { fontSize: 13, color: '#888', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: '700', color: '#10b981' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  actionBtn: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14,
    padding: 20, width: '47%', alignItems: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { fontSize: 13, color: '#aaa' },
  logoutBtn: { alignSelf: 'center', padding: 12 },
  logoutText: { color: '#ef4444', fontSize: 14 },
});
