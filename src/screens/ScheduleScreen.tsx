// CHUCHUTEA — Employee Schedule Screen (M3, now with working swap/leave APIs)
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface ScheduleEntry {
  id: string; date: string; shiftType: string;
  startTime: string; endTime: string; status: string;
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '☀️ Утро', afternoon: '🌤 День', evening: '🌙 Вечер', night: '🌃 Ночь',
};
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const LEAVE_TYPES = [
  { key: 'SICK', label: '🤒 Больничный' },
  { key: 'VACATION', label: '🏖️ Отпуск' },
  { key: 'PERSONAL', label: '👨‍👩‍👧 Семейные' },
  { key: 'UNPAID', label: '💸 Без содержания' },
];

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<[string, ScheduleEntry | null][]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Swap modal
  const [showSwap, setShowSwap] = useState(false);
  const [swapDay, setSwapDay] = useState('');
  const [swapScheduleId, setSwapScheduleId] = useState('');
  const [targetScheduleId, setTargetScheduleId] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [swapMsg, setSwapMsg] = useState('');

  // Leave modal
  const [showLeave, setShowLeave] = useState(false);
  const [leaveType, setLeaveType] = useState('VACATION');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState('');

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailEntry, setDetailEntry] = useState<ScheduleEntry | null>(null);

  // My leave history
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
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
      // Load my leaves
      const lr = await authFetch('/schedules/leave');
      if (lr.ok) setMyLeaves(await lr.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  function openSwap(entry: ScheduleEntry) {
    setSwapScheduleId(entry.id);
    setSwapDay(entry.date.split('T')[0]);
    setShowSwap(true);
    setSwapMsg('');
    setTargetScheduleId('');
    setSwapReason('');
  }

  async function submitSwap() {
    if (!targetScheduleId.trim()) { setSwapMsg('Введите ID смены для обмена'); return; }
    try {
      const res = await authFetch('/schedules/swap', {
        method: 'POST',
        body: JSON.stringify({ myScheduleId: swapScheduleId, targetScheduleId: targetScheduleId.trim(), reason: swapReason }),
      });
      const d = await res.json();
      if (res.ok) {
        setSwapMsg('✅ ' + d.message);
        setTimeout(() => { setShowSwap(false); loadData(); }, 1500);
      } else setSwapMsg('❌ ' + (d.error || 'Ошибка'));
    } catch { setSwapMsg('❌ Нет соединения'); }
  }

  function openLeave(entry: ScheduleEntry | null) {
    if (entry) setLeaveStart(entry.date.split('T')[0]);
    setShowLeave(true);
    setLeaveMsg('');
  }

  async function submitLeave() {
    if (!leaveStart.trim()) { setLeaveMsg('Укажите дату начала'); return; }
    try {
      const res = await authFetch('/schedules/leave', {
        method: 'POST',
        body: JSON.stringify({
          leaveType, startDate: leaveStart.trim(),
          endDate: leaveEnd.trim() || leaveStart.trim(),
          reason: leaveReason,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setLeaveMsg('✅ ' + d.message);
        setTimeout(() => { setShowLeave(false); loadData(); }, 1500);
      } else setLeaveMsg('❌ ' + (d.error || 'Ошибка'));
    } catch { setLeaveMsg('❌ Нет соединения'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#10b981" />}>
      <Text style={styles.title}>📅 Мой график</Text>

      <View style={styles.weekGrid}>
        {weekData.map(([key, entry]) => {
          const d = new Date(key + 'T00:00:00');
          const dayName = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const isToday = new Date().toISOString().split('T')[0] === key;

          return (
            <TouchableOpacity key={key} style={[styles.dayCard, isToday && styles.dayCardToday]} onPress={() => { entry ? setDetailEntry(entry) : null; setShowDetail(true); }}>
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
            </TouchableOpacity>
          );
        })}
      </View>

      {detailEntry && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{detailEntry.date.split('T')[0]} · {SHIFT_LABELS[detailEntry.shiftType] || detailEntry.shiftType}</Text>
          <Text style={styles.detailTime}>{detailEntry.startTime} – {detailEntry.endTime}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openSwap(detailEntry)}>
              <Text style={styles.actionIcon}>🔄</Text><Text style={styles.actionText}>Обмен смены</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openLeave(detailEntry)}>
              <Text style={styles.actionIcon}>🏖️</Text><Text style={styles.actionText}>Отпуск</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* My leave requests */}
      {myLeaves.length > 0 && (
        <View style={styles.leaveSection}>
          <Text style={styles.sectionTitle}>Мои заявки на отпуск</Text>
          {myLeaves.map((l: any) => (
            <View key={l.id} style={styles.leaveItem}>
              <Text style={styles.leaveType}>{LEAVE_TYPES.find(t => t.key === l.leaveType)?.label || l.leaveType}</Text>
              <Text style={styles.leaveDates}>{new Date(l.startDate).toLocaleDateString('ru')} – {new Date(l.endDate).toLocaleDateString('ru')}</Text>
              <Text style={[styles.leaveStatus, l.status === 'APPROVED' ? { color: '#10b981' } : l.status === 'REJECTED' ? { color: '#ef4444' } : { color: '#f59e0b' }]}>
                {l.status === 'APPROVED' ? '✅ Одобрено' : l.status === 'REJECTED' ? '❌ Отклонено' : '⏳ На рассмотрении'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Swap Modal */}
      <Modal visible={showSwap} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>🔄 Обмен смены</Text>
          <Text style={styles.modalDesc}>Дата: {swapDay}</Text>
          <Text style={styles.fieldLabel}>ID смены для обмена</Text>
          <TextInput style={styles.input} value={targetScheduleId} onChangeText={setTargetScheduleId} placeholder="Спросите у коллеги" placeholderTextColor="#555" />
          <Text style={styles.fieldLabel}>Причина</Text>
          <TextInput style={styles.input} value={swapReason} onChangeText={setSwapReason} placeholder="Необязательно" placeholderTextColor="#555" />
          {swapMsg ? <Text style={{ color: swapMsg.startsWith('✅') ? '#10b981' : '#ef4444', textAlign: 'center', marginTop: 8 }}>{swapMsg}</Text> : null}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSwap(false)}><Text style={styles.cancelText}>Отмена</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submitSwap}><Text style={styles.submitText}>Отправить</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Leave Modal */}
      <Modal visible={showLeave} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>🏖️ Заявка на отпуск</Text>
          <Text style={styles.fieldLabel}>Тип отпуска</Text>
          <View style={styles.typeRow}>
            {LEAVE_TYPES.map(t => (
              <TouchableOpacity key={t.key} style={[styles.typeBtn, leaveType === t.key && styles.typeBtnActive]} onPress={() => setLeaveType(t.key)}>
                <Text style={[styles.typeText, leaveType === t.key && styles.typeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Дата начала</Text>
          <TextInput style={styles.input} value={leaveStart} onChangeText={setLeaveStart} placeholder="YYYY-MM-DD" placeholderTextColor="#555" />
          <Text style={styles.fieldLabel}>Дата окончания</Text>
          <TextInput style={styles.input} value={leaveEnd} onChangeText={setLeaveEnd} placeholder="YYYY-MM-DD" placeholderTextColor="#555" />
          <Text style={styles.fieldLabel}>Причина</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={leaveReason} onChangeText={setLeaveReason} placeholder="Необязательно" placeholderTextColor="#555" multiline />
          {leaveMsg ? <Text style={{ color: leaveMsg.startsWith('✅') ? '#10b981' : '#ef4444', textAlign: 'center', marginTop: 8 }}>{leaveMsg}</Text> : null}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLeave(false)}><Text style={styles.cancelText}>Отмена</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submitLeave}><Text style={styles.submitText}>Отправить</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 20 },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayCard: { width: '13.5%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  dayCardToday: { borderColor: '#10b981', backgroundColor: '#10b98110' },
  dayName: { fontSize: 11, color: '#666', marginBottom: 2 }, dayNameToday: { color: '#10b981' },
  dayNum: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 }, dayNumToday: { color: '#10b981' },
  shiftInfo: { alignItems: 'center' },
  shiftLabel: { fontSize: 14 },
  shiftTime: { fontSize: 9, color: '#888', textAlign: 'center' },
  dayOff: { fontSize: 9, color: '#444' },
  detailCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 16, marginBottom: 16 },
  detailTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  detailTime: { color: '#10b981', fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 14, alignItems: 'center' },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 12, color: '#aaa' },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 8 },
  leaveSection: { marginTop: 8, marginBottom: 8 },
  leaveItem: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 12, marginBottom: 6 },
  leaveType: { color: '#fff', fontSize: 14, fontWeight: '600' },
  leaveDates: { color: '#888', fontSize: 12, marginTop: 2 },
  leaveStatus: { fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  modalDesc: { color: '#888', fontSize: 13, marginBottom: 8 },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  typeBtnActive: { borderColor: '#10b981', backgroundColor: '#10b98115' },
  typeText: { color: '#888', fontSize: 12 },
  typeTextActive: { color: '#10b981', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelText: { color: '#aaa', fontSize: 15 },
  submitBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  submitText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
