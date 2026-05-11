import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, RefreshControl,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface AttendanceRecord {
  id: string; date: string; checkIn: string; checkOut: string | null;
  status: string; lateMinutes: number; checkInSource: string;
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
// Mock store locations for GPS check
const STORE_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  's-001': { lat: 55.751244, lng: 37.618423, name: 'CHUCHUTEA Арбат' },
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthStats, setMonthStats] = useState<any>({});
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', reason: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [recsRes, summaryRes] = await Promise.all([
        authFetch(`/attendance?month=${month}`),
        authFetch(`/attendance/summary?type=monthly&month=${month}`),
      ]);
      if (recsRes.ok) {
        const data: AttendanceRecord[] = await recsRes.json();
        setRecords(data);
        const today = data.find(r => r.date && new Date(r.date).toDateString() === new Date().toDateString());
        setTodayRecord(today || null);
      }
      if (summaryRes.ok) setMonthStats(await summaryRes.json());
    } catch {}
    setLoading(false);
  }

  async function checkIn() {
    setChecking(true); setStatusMsg('');
    try {
      // GPS geofence check (mock — 50m radius around store)
      const storeLoc = STORE_LOCATIONS[user?.orgId || 's-001'];
      const gpsOk = storeLoc != null; // In real app: navigator.geolocation + distance calc
      
      const res = await authFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          checkType: gpsOk ? 'gps' : 'manual',
          latitude: storeLoc?.lat, longitude: storeLoc?.lng,
        }),
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

  async function submitCorrection() {
    setStatusMsg('');
    if (!correctionForm.reason.trim()) { setStatusMsg('❌ Укажите причину'); return; }
    try {
      const res = await authFetch('/attendance/summary', {
        method: 'POST',
        body: JSON.stringify(correctionForm),
      });
      if (res.ok) {
        setShowCorrection(false);
        setStatusMsg('✅ Заявка на коррекцию отправлена');
        loadData();
      } else {
        const e = await res.json();
        setStatusMsg('❌ ' + (e.error || 'Ошибка'));
      }
    } catch { setStatusMsg('❌ Нет связи'); }
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
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor="#10b981" />}>
      <Text style={styles.title}>⏰ Отметки</Text>

      {/* Monthly summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{monthStats.presentDays || 0}</Text>
          <Text style={styles.summaryLabel}>Дней на работе</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{monthStats.lateDays || 0}</Text>
          <Text style={styles.summaryLabel}>Опозданий</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>{monthStats.totalWorkHours || 0}ч</Text>
          <Text style={styles.summaryLabel}>Отработано</Text>
        </View>
      </View>

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
            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Источник</Text>
              <Text style={styles.todayValue}>
                {todayRecord.checkInSource === 'gps' ? '📍 GPS' : todayRecord.checkInSource === 'manual' ? '✏️ Ручной' : todayRecord.checkInSource}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noRecord}>Ещё не отмечен</Text>
        )}
        {statusMsg ? <Text style={[styles.msg, { color: statusMsg.startsWith('✅') ? '#10b981' : statusMsg.startsWith('❌') ? '#ef4444' : '#f59e0b' }]}>{statusMsg}</Text> : null}
        <TouchableOpacity style={[styles.checkBtn, checking && styles.checkBtnDisabled]} onPress={checkIn} disabled={checking}>
          {checking ? <ActivityIndicator color="#000" /> : (
            <Text style={styles.checkBtnText}>
              {todayRecord && !todayRecord.checkOut ? '🏁 Отметиться (уход)' : todayRecord && todayRecord.checkOut ? '✅ Отмечен сегодня' : '📍 Отметиться (приход)'}
            </Text>
          )}
        </TouchableOpacity>
        {!todayRecord && (
          <TouchableOpacity style={styles.correctBtn} onPress={() => setShowCorrection(true)}>
            <Text style={styles.correctBtnText}>✏️ Запросить коррекцию</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>История ({monthStats.month || ''})</Text>
      <View style={styles.historyList}>
        {records.map(r => (
          <View key={r.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{formatDate(r.date)}</Text>
            <Text style={styles.historyTime}>
              {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
              {' – '}
              {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </Text>
            <Text style={styles.historySrc}>{r.checkInSource === 'gps' ? '📍' : '✏️'}</Text>
            <Text style={[styles.historyStatus, { color: getStatusColor(r.status) }]}>{r.status}</Text>
          </View>
        ))}
        {records.length === 0 && <Text style={styles.empty}>Нет записей</Text>}
      </View>

      {/* Correction modal */}
      <Modal visible={showCorrection} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Запрос коррекции</Text>
            <Text style={styles.modalDesc}>Если забыли отметиться — укажите дату и причину. Менеджер рассмотрит запрос.</Text>

            <Text style={styles.fieldLabel}>Дата</Text>
            <TextInput style={styles.input} value={correctionForm.date} onChangeText={t => setCorrectionForm({ ...correctionForm, date: t })} placeholder="2026-05-12" placeholderTextColor="#555" />

            <Text style={styles.fieldLabel}>Время прихода (опционально)</Text>
            <TextInput style={styles.input} value={correctionForm.checkIn} onChangeText={t => setCorrectionForm({ ...correctionForm, checkIn: t })} placeholder="08:00" placeholderTextColor="#555" keyboardType="numbers-and-punctuation" />

            <Text style={styles.fieldLabel}>Время ухода (опционально)</Text>
            <TextInput style={styles.input} value={correctionForm.checkOut} onChangeText={t => setCorrectionForm({ ...correctionForm, checkOut: t })} placeholder="16:00" placeholderTextColor="#555" keyboardType="numbers-and-punctuation" />

            <Text style={styles.fieldLabel}>Причина *</Text>
            <TextInput style={[styles.input, styles.reasonInput]} value={correctionForm.reason} onChangeText={t => setCorrectionForm({ ...correctionForm, reason: t })} placeholder="Забыл отметиться" placeholderTextColor="#555" multiline />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCorrection(false)}><Text style={styles.cancelBtnText}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={submitCorrection}><Text style={styles.saveBtnText}>Отправить</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
  todayCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 16, padding: 20, marginBottom: 24 },
  todayTitle: { fontSize: 14, color: '#888', marginBottom: 14 },
  todayDetail: { marginBottom: 16 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  todayLabel: { color: '#888', fontSize: 14 },
  todayValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noRecord: { color: '#555', fontSize: 14, marginBottom: 16 },
  msg: { textAlign: 'center', fontSize: 14, marginBottom: 12 },
  checkBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  correctBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  correctBtnText: { color: '#888', fontSize: 14 },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  historyList: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, overflow: 'hidden', marginBottom: 30 },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  historyDate: { color: '#ccc', fontSize: 12, width: 65 },
  historyTime: { color: '#888', fontSize: 12, flex: 1, textAlign: 'center' },
  historySrc: { fontSize: 12, width: 24, textAlign: 'center' },
  historyStatus: { fontSize: 12, fontWeight: '600', width: 55, textAlign: 'right' },
  empty: { color: '#555', textAlign: 'center', padding: 24, fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  modalDesc: { color: '#666', fontSize: 13, marginBottom: 16 },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, color: '#fff', fontSize: 15 },
  reasonInput: { minHeight: 60, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelBtnText: { color: '#aaa', fontSize: 15 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
