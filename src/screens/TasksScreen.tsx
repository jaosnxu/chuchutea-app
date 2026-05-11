// CHUCHUTEA — Employee Tasks Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface TaskStep {
  id: string; stepIndex: number; completed: boolean; photoUrl?: string; note?: string;
}
interface TaskAssignment {
  id: string; employeeId: string; employee: { id: string; firstNameRu: string; lastNameRu: string }; status: string;
}
interface Task {
  id: string; titleRu: string; descriptionRu?: string; status: string; priority: string;
  deadline?: string; createdAt: string; assignments: TaskAssignment[]; steps: TaskStep[];
}

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', assigneeId: 'emp-staff', priority: 'normal' });
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      const res = await authFetch(`/tasks?orgId=s-001`);
      if (res.ok) setTasks(await res.json());
    } catch {}
    setLoading(false);
  }

  async function toggleStep(taskId: string, stepId: string) {
    try {
      const res = await authFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stepId }),
      });
      if (res.ok) loadTasks();
    } catch {}
  }

  async function createTask() {
    setStatusMsg('');
    if (!form.title.trim()) { setStatusMsg('Введите название'); return; }
    try {
      const res = await authFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(), orgId: 's-001',
          assigneeIds: [form.assigneeId], priority: form.priority,
          steps: [{}, {}, {}],
        }),
      });
      if (res.ok) { setShowCreate(false); loadTasks(); }
      else { const e = await res.json(); setStatusMsg('❌ ' + (e.error || 'Ошибка')); }
    } catch { setStatusMsg('❌ Нет соединения'); }
  }

  const priorityColor = (p: string) => p === 'urgent' ? '#ef4444' : p === 'important' ? '#f59e0b' : '#666';
  const priorityLabel = (p: string) => p === 'urgent' ? 'Срочно' : p === 'important' ? 'Важно' : 'Обычно';

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Задачи</Text>
        {['store_manager','region_manager','ceo','headquarters'].includes(user?.role||'') && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.addBtnText}>+ Новая</Text>
          </TouchableOpacity>
        )}
      </View>

      {statusMsg ? <Text style={{color:statusMsg.startsWith('❌')?'#ef4444':'#10b981',textAlign:'center',marginBottom:12}}>{statusMsg}</Text> : null}

      {tasks.length === 0 ? <Text style={styles.empty}>Нет задач</Text> : tasks.map(task => (
        <View key={task.id} style={[styles.card, task.status === 'completed' && styles.cardDone]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{task.titleRu}</Text>
              {task.descriptionRu ? <Text style={styles.cardDesc}>{task.descriptionRu}</Text> : null}
            </View>
            <View style={[styles.priorityBadge, { borderColor: priorityColor(task.priority) }]}>
              <Text style={[styles.priorityText, { color: priorityColor(task.priority) }]}>{priorityLabel(task.priority)}</Text>
            </View>
          </View>

          {task.assignments?.length > 0 && (
            <Text style={styles.assigned}>
              👤 {task.assignments.map(a => a.employee.firstNameRu).join(', ')}
            </Text>
          )}

          {task.steps?.length > 0 && (
            <View style={styles.stepList}>
              {task.steps.map((step, i) => (
                <TouchableOpacity key={step.id} style={styles.stepRow} onPress={() => toggleStep(task.id, step.id)}>
                  <View style={[styles.checkbox, step.completed && styles.checkboxDone]}>
                    {step.completed ? <Text style={styles.checkmark}>✓</Text> : <Text style={styles.checkmark}>{i + 1}</Text>}
                  </View>
                  <Text style={[styles.stepText, step.completed && styles.stepTextDone]}>
                    Шаг {step.stepIndex + 1} {step.completed ? '✅' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.statusText}>{task.status === 'completed' ? '✅ Завершено' : task.status === 'in_progress' ? '⏳ В процессе' : '⬜ Ожидает'}</Text>
            {task.deadline && <Text style={styles.deadline}>До {new Date(task.deadline).toLocaleDateString('ru-RU')}</Text>}
          </View>
        </View>
      ))}

      {/* Create Task Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новая задача</Text>
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={t => setForm({...form, title:t})} placeholder="Открытие смены" placeholderTextColor="#555" />
            <Text style={styles.fieldLabel}>Приоритет</Text>
            <View style={styles.priorityRow}>
              {['normal','important','urgent'].map(p => (
                <TouchableOpacity key={p} style={[styles.priBtn, form.priority===p&&{backgroundColor:p==='urgent'?'#ef444420':p==='important'?'#f59e0b20':'#66620',borderColor:priorityColor(p)}]}
                  onPress={() => setForm({...form, priority:p})}>
                  <Text style={{color:priorityColor(p),fontWeight:'600',fontSize:13}}>{priorityLabel(p)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelBtnText}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createTask}><Text style={styles.saveBtnText}>Создать</Text></TouchableOpacity>
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
  empty: { color: '#555', textAlign: 'center', padding: 48, fontSize: 14 },
  card: { backgroundColor: '#111', borderWidth:1, borderColor:'#222', borderRadius:14, padding:16, marginBottom:12 },
  cardDone: { opacity: 0.4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:8 },
  cardTitle: { color: '#fff', fontSize:16, fontWeight:'600', flex:1 },
  cardDesc: { color: '#888', fontSize:13, marginTop:4 },
  priorityBadge: { borderWidth:1, borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  priorityText: { fontSize:11, fontWeight:'600' },
  assigned: { color: '#888', fontSize:13, marginBottom:8 },
  stepList: { borderTopWidth:1, borderTopColor:'#1a1a1a', paddingTop:8, marginTop:4 },
  stepRow: { flexDirection:'row', alignItems:'center', paddingVertical:6 },
  checkbox: { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:'#333', alignItems:'center', justifyContent:'center', marginRight:10 },
  checkboxDone: { backgroundColor:'#10b981', borderColor:'#10b981' },
  checkmark: { color:'#fff', fontSize:11, fontWeight:'700' },
  stepText: { color:'#ccc', fontSize:14 },
  stepTextDone: { color:'#888', textDecorationLine:'line-through' },
  cardFooter: { flexDirection:'row', justifyContent:'space-between', marginTop:10, borderTopWidth:1, borderTopColor:'#1a1a1a', paddingTop:10 },
  statusText: { color:'#888', fontSize:12 },
  deadline: { color:'#666', fontSize:12 },
  // Modal
  modalOverlay: { flex:1, backgroundColor:'#00000080', justifyContent:'flex-end' },
  modal: { backgroundColor:'#111', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 },
  modalTitle: { fontSize:18, fontWeight:'700', color:'#fff', marginBottom:20 },
  fieldLabel: { color:'#888', fontSize:12, marginBottom:6, marginTop:12 },
  input: { backgroundColor:'#0a0a0a', borderWidth:1, borderColor:'#333', borderRadius:8, padding:12, color:'#fff', fontSize:15 },
  priorityRow: { flexDirection:'row', gap:8, marginBottom:20 },
  priBtn: { flex:1, padding:10, borderRadius:8, borderWidth:1, borderColor:'#333', alignItems:'center' },
  modalBtns: { flexDirection:'row', gap:12 },
  cancelBtn: { flex:1, padding:14, borderRadius:10, borderWidth:1, borderColor:'#333', alignItems:'center' },
  cancelBtnText: { color:'#aaa', fontSize:15 },
  saveBtn: { flex:1, padding:14, borderRadius:10, backgroundColor:'#10b981', alignItems:'center' },
  saveBtnText: { color:'#000', fontSize:15, fontWeight:'600' },
});
