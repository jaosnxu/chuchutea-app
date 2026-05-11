// CHUCHUTEA — Manager Schedule Management Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface Employee {
  id: string; firstNameRu: string; lastNameRu: string; role: string;
}

interface ScheduleEntry {
  id: string; employeeId: string; date: string; shiftType: string;
  startTime: string; endTime: string; status: string;
}

const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night'];

export default function ManagerScheduleScreen() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeId: '', date: selectedDate, shiftType: 'morning', startTime: '08:00', endTime: '16:00' });
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, [selectedDate]);

  async function loadData() {
    try {
      const [empRes, schedRes] = await Promise.all([
        authFetch('/hr/employees'),
        authFetch(`/schedules?orgId=s-001&date=${selectedDate}`),
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (schedRes.ok) setSchedules(await schedRes.json());
    } catch {}
    setLoading(false);
  }

  async function addSchedule() {
    setMessage('');
    try {
      const res = await authFetch('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          entries: [{
            employeeId: form.employeeId, orgId: 's-001',
            date: form.date, shiftType: form.shiftType,
            startTime: form.startTime, endTime: form.endTime,
          }],
        }),
      });
      if (res.ok) { setShowAdd(false); setMessage('✅ Смена добавлена'); loadData(); }
      else { const e = await res.json(); setMessage('❌ ' + (e.error || 'Ошибка')); }
    } catch { setMessage('❌ Нет соединения'); }
  }

  function getShiftForEmployee(empId: string): ScheduleEntry | undefined {
    return schedules.find(s => s.employeeId === empId);
  }

  const shiftStyle = (type: string) => ({
    backgroundColor: type === 'morning' ? '#10b98120' : type === 'afternoon' ? '#f59e0b20' : type === 'evening' ? '#6366f120' : '#8b5cf620',
    color: type === 'morning' ? '#10b981' : type === 'afternoon' ? '#f59e0b' : type === 'evening' ? '#6366f1' : '#8b5cf6',
  });

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 График смен</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ ...form, date: selectedDate }); setShowAdd(true); }}>
          <Text style={styles.addBtnText}>+ Смена</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={{ color: message.startsWith('✅') ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: 12 }}>{message}</Text> : null}

      {/* Date selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
        {[...Array(7)].map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i);
          const key = d.toISOString().split('T')[0];
          const isSelected = key === selectedDate;
          return (
            <TouchableOpacity key={key} style={[styles.dateBtn, isSelected && styles.dateBtnActive]}
              onPress={() => setSelectedDate(key)}>
              <Text style={[styles.dateBtnText, isSelected && styles.dateBtnTextActive]}>
                {d.getDate()}/{d.getMonth() + 1}
              </Text>
              <Text style={[styles.dateBtnDay, isSelected && styles.dateBtnDayActive]}>
                {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Employee schedule rows */}
      <View style={styles.list}>
        {employees.map(emp => {
          const shift = getShiftForEmployee(emp.id);
          return (
            <View key={emp.id} style={styles.row}>
              <View style={styles.empInfo}>
                <Text style={styles.empName}>{emp.firstNameRu} {emp.lastNameRu}</Text>
                <Text style={styles.empRole}>{emp.role}</Text>
              </View>
              {shift ? (
                <View style={[styles.shiftBadge, { backgroundColor: shiftStyle(shift.shiftType).backgroundColor }]}>
                  <Text style={[styles.shiftBadgeText, { color: shiftStyle(shift.shiftType).color }]}>
                    {shift.startTime}–{shift.endTime}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noShift}>Выходной</Text>
              )}
            </View>
          );
        })}
        {employees.length === 0 && <Text style={styles.empty}>Нет сотрудников</Text>}
      </View>

      {/* Add Shift Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Добавить смену</Text>

            <Text style={styles.fieldLabel}>Сотрудник</Text>
            <ScrollView style={styles.empPicker} nestedScrollEnabled>
              {employees.map(emp => (
                <TouchableOpacity key={emp.id}
                  style={[styles.empOption, form.employeeId === emp.id && styles.empOptionActive]}
                  onPress={() => setForm({ ...form, employeeId: emp.id })}>
                  <Text style={[styles.empOptionText, form.employeeId === emp.id && styles.empOptionTextActive]}>
                    {emp.firstNameRu} {emp.lastNameRu}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.shiftTypeRow}>
              {SHIFT_TYPES.map(t => (
                <TouchableOpacity key={t}
                  style={[styles.shiftTypeBtn, form.shiftType === t && { backgroundColor: shiftStyle(t).backgroundColor, borderColor: shiftStyle(t).color }]}
                  onPress={() => setForm({ ...form, shiftType: t, startTime: t === 'morning' ? '08:00' : t === 'afternoon' ? '12:00' : t === 'evening' ? '16:00' : '22:00', endTime: t === 'morning' ? '16:00' : t === 'afternoon' ? '20:00' : t === 'evening' ? '23:00' : '06:00' })}>
                  <Text style={[styles.shiftTypeText, { color: shiftStyle(t).color }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>Начало</Text>
                <TextInput style={styles.input} value={form.startTime} onChangeText={t => setForm({ ...form, startTime: t })} />
              </View>
              <Text style={styles.timeSep}>–</Text>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>Конец</Text>
                <TextInput style={styles.input} value={form.endTime} onChangeText={t => setForm({ ...form, endTime: t })} />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addSchedule}>
                <Text style={styles.saveBtnText}>Сохранить</Text>
              </TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#000', fontWeight: '600', fontSize: 14 },
  dateStrip: { marginBottom: 20 },
  dateBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', marginRight: 8, alignItems: 'center' },
  dateBtnActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  dateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dateBtnTextActive: { color: '#10b981' },
  dateBtnDay: { color: '#666', fontSize: 11, marginTop: 2 },
  dateBtnDayActive: { color: '#10b981' },
  list: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  empInfo: { flex: 1 },
  empName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empRole: { color: '#666', fontSize: 12, marginTop: 2 },
  shiftBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shiftBadgeText: { fontSize: 13, fontWeight: '600' },
  noShift: { color: '#444', fontSize: 13 },
  empty: { color: '#555', textAlign: 'center', padding: 24 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20 },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12 },
  empPicker: { maxHeight: 150, backgroundColor: '#0a0a0a', borderRadius: 10, marginBottom: 12 },
  empOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  empOptionActive: { backgroundColor: '#10b98110' },
  empOptionText: { color: '#aaa', fontSize: 14 },
  empOptionTextActive: { color: '#10b981', fontWeight: '600' },
  shiftTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shiftTypeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  shiftTypeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 20 },
  timeField: { flex: 1 },
  timeSep: { color: '#666', fontSize: 20, paddingBottom: 14 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelBtnText: { color: '#aaa', fontSize: 15 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
