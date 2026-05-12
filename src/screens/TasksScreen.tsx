import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

// Simple photo capture — in production use react-native-image-picker
async function takePhoto(): Promise<string> {
  // Dev mode: return a placeholder. Production: launch camera via ImagePicker
  return new Promise((resolve) => {
    setTimeout(() => resolve('photo_' + Date.now()), 300);
  });
}

interface TaskStep {
  id: string; stepIndex: number; completed: boolean; photoUrl?: string; note?: string;
}
interface TaskAssignment {
  id: string; employeeId: string; status: string;
  employee: { id: string; firstNameRu: string; lastNameRu: string };
}
interface Task {
  id: string; titleRu: string; descriptionRu?: string; status: string; priority: string;
  deadline?: string; createdAt: string; assignments: TaskAssignment[]; steps: TaskStep[];
}

const STEP_LABELS: Record<number, string> = { 0: 'Проверить кассу', 1: 'Проверить температуру', 2: 'Подготовить ингредиенты', 3: 'Уборка', 4: 'Закрытие' };
const STATUS_NAMES: Record<string, string> = { pending: 'Ожидает', in_progress: 'В процессе', completed: 'Завершено' };

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all'|'pending'|'completed'>('all');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      const url = user?.role === 'employee' ? '/tasks?my=true' : '/tasks?orgId=s-001';
      const res = await authFetch(url);
      if (res.ok) setTasks(await res.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  async function toggleStep(taskId: string, stepId: string) {
    try {
      await authFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ stepId }) });
      loadTasks();
    } catch {}
  }

  async function handleStepPhoto(taskId: string, stepIndex: number) {
    try {
      const photoId = await takePhoto();
      Alert.alert('📸', 'Фото сделано: ' + photoId);
      await authFetch('/tasks/photo', {
        method: 'POST',
        body: JSON.stringify({ taskId, stepIndex, description: photoId }),
      });
      loadTasks();
    } catch {}
  }

  const filtered = tasks.filter(t =>
    activeTab === 'all' ? true : activeTab === 'pending' ? t.status !== 'completed' : t.status === 'completed'
  );
  const doneCount = tasks.filter(t => t.status === 'completed').length;
  const activeCount = tasks.filter(t => t.status !== 'completed').length;
  const priorityColor = (p: string) => p === 'urgent' ? '#ef4444' : p === 'important' ? '#f59e0b' : '#666';

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} tintColor="#10b981" />}>
      <Text style={styles.title}>📋 Задачи</Text>

      <View style={styles.tabRow}>
        {(['all', 'pending', 'completed'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? `Все (${tasks.length})` : tab === 'pending' ? `Активные (${activeCount})` : `Готово (${doneCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>{activeTab === 'completed' ? 'Нет завершённых' : 'Нет задач'}</Text>
      ) : filtered.map(task => (
        <View key={task.id} style={[styles.card, task.status === 'completed' && styles.cardDone]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{task.titleRu}</Text>
              {task.descriptionRu ? <Text style={styles.cardDesc}>{task.descriptionRu}</Text> : null}
            </View>
            <View style={[styles.pBadge, { borderColor: priorityColor(task.priority) }]}>
              <Text style={[styles.pText, { color: priorityColor(task.priority) }]}>
                {task.priority === 'urgent' ? 'Срочно' : task.priority === 'important' ? 'Важно' : 'Обычно'}
              </Text>
            </View>
          </View>

          {task.assignments?.length > 0 && (
            <Text style={styles.assignees}>👤 {task.assignments.map(a => a.employee.firstNameRu).join(', ')}</Text>
          )}

          {/* Progress bar */}
          {task.steps?.length > 0 && (
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${task.steps.filter(s => s.completed).length / task.steps.length * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{task.steps.filter(s => s.completed).length}/{task.steps.length}</Text>
            </View>
          )}

          {/* Steps */}
          {task.steps?.length > 0 && (
            <View style={styles.stepList}>
              {task.steps.map(step => (
                <TouchableOpacity key={step.id} style={styles.stepRow} onPress={() => toggleStep(task.id, step.id)}>
                  <View style={[styles.chk, step.completed && styles.chkDone]}>
                    {step.completed ? <Text style={styles.chkMark}>✓</Text> : <Text style={styles.chkNum}>{step.stepIndex + 1}</Text>}
                  </View>
                  <Text style={[styles.stepLabel, step.completed && styles.stepLabelDone]}>
                    {STEP_LABELS[step.stepIndex] || `Шаг ${step.stepIndex + 1}`}
                  </Text>
                  {!step.completed && (
                    <TouchableOpacity style={styles.photoBtn} onPress={() => handleStepPhoto(task.id, step.stepIndex)}>
                      <Text style={styles.photoBtnIcon}>📸</Text>
                    </TouchableOpacity>
                  )}
                  {step.completed && step.photoUrl && <Text style={styles.stepPhoto}>📸</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={[styles.statusTag, { color: task.status === 'completed' ? '#10b981' : task.status === 'in_progress' ? '#3b82f6' : '#888' }]}>
              {STATUS_NAMES[task.status] || task.status}
            </Text>
            {task.deadline && (
              <Text style={[styles.deadline, new Date(task.deadline) < new Date() && { color: '#ef4444' }]}>
                {new Date(task.deadline) < new Date() ? '🔴 Просрочено' : 'До ' + new Date(task.deadline).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </View>
        </View>
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#10b98120' },
  tabText: { color: '#666', fontSize: 13 },
  tabTextActive: { color: '#10b981', fontWeight: '600' },
  empty: { color: '#555', textAlign: 'center', padding: 48 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardDone: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  cardDesc: { color: '#888', fontSize: 12, marginTop: 4 },
  pBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pText: { fontSize: 11, fontWeight: '600' },
  assignees: { color: '#888', fontSize: 12, marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },
  progressText: { color: '#888', fontSize: 11 },
  stepList: { borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  chk: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chkDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chkMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chkNum: { color: '#666', fontSize: 11, fontWeight: '600' },
  stepLabel: { color: '#ccc', fontSize: 13, flex: 1 },
  stepLabelDone: { color: '#666', textDecorationLine: 'line-through' },
  stepPhoto: { fontSize: 14 },
  photoBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#3b82f620' },
  photoBtnIcon: { fontSize: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 10 },
  statusTag: { fontSize: 12, fontWeight: '600' },
  deadline: { color: '#666', fontSize: 12 },
});
