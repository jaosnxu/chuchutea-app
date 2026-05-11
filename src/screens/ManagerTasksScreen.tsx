// CHUCHUTEA — Manager Task Dispatch Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, RefreshControl, Switch,
} from 'react-native';
import { authFetch } from '../contexts/AuthContext';

interface Employee { id: string; firstNameRu: string; lastNameRu: string; role: string; }
interface TaskTemplate { id: string; nameRu: string; category: string; steps: any[]; }
interface StepDraft { description: string; requiresPhoto: boolean; }
interface TaskItem {
  id: string; titleRu: string; status: string; priority: string;
  deadline?: string; assignments: any[]; steps: any[];
  creator?: { firstNameRu: string; lastNameRu: string; };
}

export default function ManagerTasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'normal',
    assigneeIds: [] as string[], deadlineHours: 24,
    steps: [] as StepDraft[],
  });
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [tRes, eRes, tmplRes] = await Promise.all([
        authFetch('/tasks?orgId=s-001'),
        authFetch('/hr/employees'),
        fetch('http://localhost:3000/api/config/task-templates').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      if (tRes.ok) setTasks(await tRes.json());
      if (eRes.ok) setEmployees(await eRes.json());
      if (Array.isArray(tmplRes)) setTemplates(tmplRes);
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  function toggleAssignee(id: string) {
    setForm(f => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter(a => a !== id) : [...f.assigneeIds, id],
    }));
  }

  function addStep() { setForm(f => ({ ...f, steps: [...f.steps, { description: '', requiresPhoto: true }] })); }
  function updateStep(i: number, field: string, val: any) {
    setForm(f => { const s = [...f.steps]; (s[i] as any)[field] = val; return { ...f, steps: s }; });
  }
  function removeStep(i: number) { setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) })); }

  function applyTemplate(tmpl: TaskTemplate) {
    setForm(f => ({
      ...f,
      title: tmpl.nameRu,
      steps: (tmpl.steps || []).map((s: any) => ({
        description: typeof s === 'string' ? s : (s.description || ''),
        requiresPhoto: typeof s === 'object' ? (s.requiresPhoto ?? true) : true,
      })),
    }));
  }

  async function createTask() {
    setStatusMsg('');
    if (!form.title.trim()) { setStatusMsg('Введите название'); return; }
    if (form.assigneeIds.length === 0) { setStatusMsg('Выберите сотрудника'); return; }
    try {
      const res = await authFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(), description: form.description.trim(),
          orgId: 's-001', priority: form.priority, assigneeIds: form.assigneeIds,
          deadlineHours: form.deadlineHours,
          steps: form.steps.map((s, i) => ({ stepIndex: i, description: s.description, requiresPhoto: s.requiresPhoto })),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', priority: 'normal', assigneeIds: [], deadlineHours: 24, steps: [] });
        loadAll();
      } else { const e = await res.json(); setStatusMsg('❌ ' + (e.error || 'Ошибка')); }
    } catch { setStatusMsg('❌ Нет соединения'); }
  }

  const filtered = tasks.filter(t => activeTab === 'all' ? true : activeTab === 'pending' ? t.status !== 'completed' : t.status === 'completed');
  const doneCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const priorityColor = (p: string) => p === 'urgent' ? '#ef4444' : p === 'important' ? '#f59e0b' : '#666';

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#10b981" />}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Задачи</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Новая</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.stat, activeTab === 'all' && styles.statActive]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.statNum, activeTab === 'all' && styles.statNumActive]}>{tasks.length}</Text>
          <Text style={styles.statLbl}>Все</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stat, activeTab === 'pending' && styles.statActive]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.statNum, activeTab === 'pending' && styles.statNumActive, { color: '#f59e0b' }]}>{pendingCount}</Text>
          <Text style={styles.statLbl}>Активные</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stat, activeTab === 'completed' && styles.statActive]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.statNum, activeTab === 'completed' && styles.statNumActive, { color: '#10b981' }]}>{doneCount}</Text>
          <Text style={styles.statLbl}>Завершены</Text>
        </TouchableOpacity>
      </View>

      {/* Task list */}
      {filtered.map(task => (
        <View key={task.id} style={[styles.card, task.status === 'completed' && styles.cardDone]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{task.titleRu}</Text>
            <View style={[styles.pBadge, { borderColor: priorityColor(task.priority) }]}>
              <Text style={[styles.pText, { color: priorityColor(task.priority) }]}>{task.priority}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.assignees}>👤 {task.assignments?.map((a: any) => a.employee?.firstNameRu).join(', ') || '—'}</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${task.steps?.length ? task.steps.filter((s: any) => s.completed).length / task.steps.length * 100 : 0}%` }]} />
              </View>
              <Text style={styles.progressText}>{task.steps?.filter((s: any) => s.completed).length || 0}/{task.steps?.length || 0}</Text>
            </View>
            {task.deadline && <Text style={styles.deadline}>До {new Date(task.deadline).toLocaleDateString('ru-RU')}</Text>}
          </View>
          <Text style={[styles.statusTag, { color: task.status === 'completed' ? '#10b981' : task.status === 'in_progress' ? '#3b82f6' : '#888' }]}>
            {task.status === 'completed' ? '✅ Завершено' : task.status === 'in_progress' ? '⏳ В процессе' : '⬜ Ожидает'}
          </Text>
        </View>
      ))}
      {filtered.length === 0 && <Text style={styles.empty}>Нет задач</Text>}

      {/* Create Task Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.modalTitle}>Новая задача</Text>

            {statusMsg ? <Text style={{ color: statusMsg.startsWith('❌') ? '#ef4444' : '#10b981', textAlign: 'center', marginBottom: 12 }}>{statusMsg}</Text> : null}

            {/* Templates */}
            {templates.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Шаблон</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tmplStrip}>
                  {templates.map(t => (
                    <TouchableOpacity key={t.id} style={styles.tmplBtn} onPress={() => applyTemplate(t)}>
                      <Text style={styles.tmplBtnText}>{t.nameRu}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.fieldLabel}>Название *</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={t => setForm(f => ({ ...f, title: t }))} placeholder="Открытие смены" placeholderTextColor="#555" />

            <Text style={styles.fieldLabel}>Описание</Text>
            <TextInput style={[styles.input, styles.multiInput]} value={form.description} onChangeText={d => setForm(f => ({ ...f, description: d }))} placeholder="Детали..." placeholderTextColor="#555" multiline />

            <Text style={styles.fieldLabel}>Приоритет</Text>
            <View style={styles.prioRow}>
              {(['normal', 'important', 'urgent'] as const).map(p => (
                <TouchableOpacity key={p} style={[styles.prioBtn, form.priority === p && { borderColor: priorityColor(p), backgroundColor: priorityColor(p) + '20' }]}
                  onPress={() => setForm(f => ({ ...f, priority: p }))}>
                  <Text style={{ color: priorityColor(p), fontWeight: '600', fontSize: 13 }}>{p === 'normal' ? 'Обычно' : p === 'important' ? 'Важно' : 'Срочно'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Срок (часов)</Text>
            <TextInput style={styles.input} value={String(form.deadlineHours)} onChangeText={t => setForm(f => ({ ...f, deadlineHours: parseInt(t) || 0 }))} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Сотрудники *</Text>
            <ScrollView style={styles.empList} nestedScrollEnabled>
              {employees.map(emp => (
                <TouchableOpacity key={emp.id} style={styles.empRow} onPress={() => toggleAssignee(emp.id)}>
                  <View style={[styles.chk, form.assigneeIds.includes(emp.id) && styles.chkActive]}>
                    {form.assigneeIds.includes(emp.id) && <Text style={styles.chkMark}>✓</Text>}
                  </View>
                  <Text style={styles.empName}>{emp.firstNameRu} {emp.lastNameRu}</Text>
                  <Text style={styles.empRole}>{emp.role}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.stepHeader}>
              <Text style={styles.fieldLabel}>Шаги</Text>
              <TouchableOpacity onPress={addStep} style={styles.addStepBtn}>
                <Text style={styles.addStepText}>+ Шаг</Text>
              </TouchableOpacity>
            </View>
            {form.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <TextInput style={styles.stepInput} value={step.description} onChangeText={v => updateStep(i, 'description', v)} placeholder="Описание шага" placeholderTextColor="#555" />
                <View style={styles.stepToggle}>
                  <Text style={{ color: '#888', fontSize: 10 }}>Фото</Text>
                  <Switch value={step.requiresPhoto} onValueChange={v => updateStep(i, 'requiresPhoto', v)} trackColor={{ false: '#333', true: '#10b98140' }} thumbColor={step.requiresPhoto ? '#10b981' : '#666'} />
                </View>
                <TouchableOpacity onPress={() => removeStep(i)}><Text style={styles.delStep}>✕</Text></TouchableOpacity>
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelBtnText}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createTask}><Text style={styles.saveBtnText}>Создать</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#000', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, alignItems: 'center' },
  statActive: { borderColor: '#10b981' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statNumActive: { color: '#10b981' },
  statLbl: { fontSize: 10, color: '#666', marginTop: 4 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardDone: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  pBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pText: { fontSize: 11, fontWeight: '600' },
  cardBody: { marginBottom: 8 },
  assignees: { color: '#888', fontSize: 12, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },
  progressText: { color: '#888', fontSize: 11 },
  deadline: { color: '#f59e0b', fontSize: 11, marginTop: 4 },
  statusTag: { fontSize: 12, fontWeight: '600' },
  empty: { color: '#555', textAlign: 'center', padding: 40 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, color: '#fff', fontSize: 15 },
  multiInput: { minHeight: 60, textAlignVertical: 'top' },
  tmplStrip: { marginBottom: 8 },
  tmplBtn: { backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98140', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  tmplBtnText: { color: '#10b981', fontSize: 13 },
  prioRow: { flexDirection: 'row', gap: 8 },
  prioBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  empList: { maxHeight: 160, backgroundColor: '#0a0a0a', borderRadius: 10, marginBottom: 8 },
  empRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  chk: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chkActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empName: { color: '#ccc', flex: 1, fontSize: 14 },
  empRole: { color: '#666', fontSize: 11 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addStepBtn: { backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  addStepText: { color: '#10b981', fontSize: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stepNum: { color: '#666', fontSize: 13, fontWeight: '600', width: 20 },
  stepInput: { flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 6, padding: 8, color: '#fff', fontSize: 13 },
  stepToggle: { alignItems: 'center' },
  delStep: { color: '#ef4444', fontSize: 16, paddingHorizontal: 4 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelBtnText: { color: '#aaa', fontSize: 15 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
