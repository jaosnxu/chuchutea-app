// CHUCHUTEA — Training Screen (course list + exam)
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, RefreshControl,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface Course {
  id: string; nameRu: string; descriptionRu?: string; difficulty: string;
  durationMinutes: number; isRequired: boolean; videoUrl?: string;
  category: { id: string; nameRu: string; code: string };
  progress: { status: string; percent: number } | null;
  examConfig: { passScore: number; maxAttempts: number } | null;
  lastExamResult: { score: number; passed: boolean; attempt: number } | null;
}

interface Question {
  id: string; questionTextRu: string; questionType: string;
  options: string[]; sortOrder: number;
}

export default function TrainingScreen() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [showExam, setShowExam] = useState(false);
  const [examCourse, setExamCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await authFetch('/learning');
      if (res.ok) setCourses(await res.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  async function startExam(course: Course) {
    setExamCourse(course); setExamResult(null); setAnswers({}); setExamLoading(false);
    try {
      const res = await authFetch('/learning/exam?courseId=' + course.id);
      if (res.ok) setQuestions(await res.json());
    } catch {}
    setShowExam(true);
  }

  async function submitExam() {
    setExamLoading(true);
    try {
      const ansArr = Object.entries(answers).map(([qid, ans]) => ({ questionId: qid, answer: ans }));
      const res = await authFetch('/learning/exam', {
        method: 'POST',
        body: JSON.stringify({ courseId: examCourse!.id, answers: ansArr, timeSpentSeconds: 0 }),
      });
      if (res.ok) { setExamResult(await res.json()); loadData(); }
    } catch {}
    setExamLoading(false);
  }

  const categories = [...new Map(courses.map(c => [c.category.id, c.category])).values()];
  const filtered = activeCat === 'all' ? courses : courses.filter(c => c.category.id === activeCat);
  const completedCount = courses.filter(c => c.progress?.status === 'completed').length;
  const requiredCount = courses.filter(c => c.isRequired && c.progress?.status !== 'completed').length;

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#10b981" />}>
      <Text style={styles.title}>📚 Обучение</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#10b981' }]}>{completedCount}</Text>
          <Text style={styles.statLbl}>Пройдено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: requiredCount > 0 ? '#ef4444' : '#10b981' }]}>{requiredCount}</Text>
          <Text style={styles.statLbl}>Обязательных</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#3b82f6' }]}>{courses.length}</Text>
          <Text style={styles.statLbl}>Всего</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catStrip}>
        <TouchableOpacity style={[styles.catBtn, activeCat === 'all' && styles.catBtnActive]} onPress={() => setActiveCat('all')}>
          <Text style={[styles.catBtnText, activeCat === 'all' && styles.catBtnTextActive]}>Все</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.catBtn, activeCat === cat.id && styles.catBtnActive]} onPress={() => setActiveCat(cat.id)}>
            <Text style={[styles.catBtnText, activeCat === cat.id && styles.catBtnTextActive]}>{cat.nameRu}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Course list */}
      {filtered.length === 0 ? <Text style={styles.empty}>Нет курсов</Text> : filtered.map(course => (
        <TouchableOpacity key={course.id} style={styles.card} onPress={() => startExam(course)}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{course.nameRu}</Text>
                {course.isRequired && <Text style={styles.reqBadge}>обяз.</Text>}
              </View>
              {course.descriptionRu && <Text style={styles.cardDesc}>{course.descriptionRu}</Text>}
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>⏱ {course.durationMinutes} мин</Text>
                <Text style={styles.metaText}>📊 {course.difficulty}</Text>
                {course.lastExamResult && (
                  <Text style={[styles.metaText, { color: course.lastExamResult.passed ? '#10b981' : '#ef4444' }]}>
                    {course.lastExamResult.passed ? '✅ Сдан' : '❌ Не сдан'}
                  </Text>
                )}
              </View>
            </View>
            {course.progress && (
              <View style={[styles.progCircle, course.progress.status === 'completed' && styles.progDone]}>
                <Text style={styles.progText}>{course.progress.percent || 0}%</Text>
              </View>
            )}
          </View>
          {course.progress && (
            <View style={styles.progBar}><View style={[styles.progFill, { width: `${course.progress.percent}%` }]} /></View>
          )}
          <TouchableOpacity style={styles.examBtn} onPress={() => startExam(course)}>
            <Text style={styles.examBtnText}>
              {course.progress?.status === 'completed' ? '📝 Пересдать экзамен' : '📝 Начать экзамен'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <View style={{ height: 80 }} />

      {/* Exam Modal */}
      <Modal visible={showExam} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.modalTitle}>{examResult ? 'Результат' : examCourse?.nameRu}</Text>
            {examCourse?.examConfig && !examResult && (
              <Text style={styles.examInfo}>
                Проходной балл: {examCourse.examConfig.passScore}% · Макс. попыток: {examCourse.examConfig.maxAttempts}
              </Text>
            )}

            {examResult ? (
              <View style={styles.resultCard}>
                <Text style={[styles.resultScore, { color: examResult.passed ? '#10b981' : '#ef4444' }]}>
                  {examResult.score}%
                </Text>
                <Text style={[styles.resultStatus, { color: examResult.passed ? '#10b981' : '#ef4444' }]}>
                  {examResult.passed ? '✅ Сдан!' : '❌ Не сдан'}
                </Text>
                <Text style={styles.resultDetail}>
                  Правильно: {examResult.correctCount}/{examResult.totalQuestions}
                </Text>
                <Text style={styles.resultDetail}>Попытка: {examResult.attemptNumber}</Text>
                {examResult.passed && <Text style={styles.resultCongrats}>🎉 Поздравляем! Курс завершён.</Text>}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowExam(false)}>
                  <Text style={styles.closeBtnText}>Закрыть</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {questions.map((q, i) => (
                  <View key={q.id} style={styles.qCard}>
                    <Text style={styles.qNum}>Вопрос {i + 1}</Text>
                    <Text style={styles.qText}>{q.questionTextRu}</Text>
                    {(q.options as string[]).map((opt, oi) => (
                      <TouchableOpacity key={oi}
                        style={[styles.optBtn, answers[q.id] === opt && styles.optActive]}
                        onPress={() => setAnswers(a => ({ ...a, [q.id]: opt }))}>
                        <Text style={[styles.optText, answers[q.id] === opt && styles.optTextActive]}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.submitBtn, examLoading && { opacity: 0.5 }]}
                  onPress={submitExam}
                  disabled={examLoading || questions.length === 0}
                >
                  {examLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Завершить экзамен</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelExamBtn} onPress={() => setShowExam(false)}>
                  <Text style={styles.cancelExamBtnText}>Отмена</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 50, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700' },
  statLbl: { fontSize: 10, color: '#666', marginTop: 4 },
  catStrip: { marginBottom: 16 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', marginRight: 8 },
  catBtnActive: { borderColor: '#10b981', backgroundColor: '#10b98110' },
  catBtnText: { color: '#888', fontSize: 13 },
  catBtnTextActive: { color: '#10b981' },
  empty: { color: '#555', textAlign: 'center', padding: 48 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  reqBadge: { backgroundColor: '#ef444420', color: '#ef4444', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardDesc: { color: '#888', fontSize: 12, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaText: { color: '#666', fontSize: 11 },
  progCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  progDone: { borderColor: '#10b981' },
  progText: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  progBar: { height: 4, backgroundColor: '#222', borderRadius: 2, marginTop: 10, marginBottom: 6 },
  progFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },
  examBtn: { marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: '#10b98120', alignItems: 'center' },
  examBtnText: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  examInfo: { color: '#888', fontSize: 13, marginBottom: 16 },
  qCard: { marginBottom: 20 },
  qNum: { color: '#10b981', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  qText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  optBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 6 },
  optActive: { borderColor: '#10b981', backgroundColor: '#10b98110' },
  optText: { color: '#ccc', fontSize: 14 },
  optTextActive: { color: '#10b981', fontWeight: '600' },
  submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  cancelExamBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  cancelExamBtnText: { color: '#888', fontSize: 14 },
  resultCard: { alignItems: 'center', paddingVertical: 20 },
  resultScore: { fontSize: 48, fontWeight: '800', marginBottom: 8 },
  resultStatus: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  resultDetail: { color: '#888', fontSize: 14, marginBottom: 4 },
  resultCongrats: { color: '#10b981', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 20 },
  closeBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#10b98120', borderRadius: 10 },
  closeBtnText: { color: '#10b981', fontSize: 15, fontWeight: '600' },
});
