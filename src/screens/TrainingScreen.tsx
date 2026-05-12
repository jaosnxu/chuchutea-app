
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface Course { id:string; nameRu:string; descriptionRu?:string; difficulty:string; durationMinutes:number; isRequired:boolean; videoUrl?:string; category:{id:string;nameRu:string;code:string}; progress:{status:string;percent:number}|null; examConfig:{passScore:number;maxAttempts:number}|null; lastExamResult:{score:number;passed:boolean;attempt:number}|null; }
interface Question { id:string; questionTextRu:string; questionType:string; options:string[]; sortOrder:number; }

const { width } = Dimensions.get('window');

export default function TrainingScreen() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showExam, setShowExam] = useState(false);
  const [examCourse, setExamCourse] = useState<Course|null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [examResult, setExamResult] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);

  useEffect(()=>{loadData();},[]);

  async function loadData(){
    try{const r=await authFetch('/learning');if(r.ok)setCourses(await r.json());}catch{}
    setLoading(false);setRefreshing(false);
  }

  function playVideo(course:Course){
    if(course.videoUrl){setVideoUrl(course.videoUrl);setShowVideo(true);}
    else{startExam(course);}
  }

  async function startExam(course:Course){setExamCourse(course);setExamResult(null);setAnswers({});try{const r=await authFetch('/learning/exam?courseId='+course.id);if(r.ok)setQuestions(await r.json());}catch{}setShowExam(true);}

  async function submitExam(){setExamLoading(true);try{const ansArr=Object.entries(answers).map(([qid,ans])=>({questionId:qid,answer:ans}));const r=await authFetch('/learning/exam',{method:'POST',body:JSON.stringify({courseId:examCourse!.id,answers:ansArr,timeSpentSeconds:0})});if(r.ok){setExamResult(await r.json());loadData();}}catch{}setExamLoading(false);}

  const cats=[...new Map(courses.map(c=>[c.category.id,c.category])).values()];
  const filtered=activeCat==='all'?courses:courses.filter(c=>c.category.id===activeCat);

  if(loading)return <View style={st.centered}><ActivityIndicator color="#10b981"/></View>;

  return (
    <ScrollView style={st.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadData()}} tintColor="#10b981"/>}>
      <Text style={st.title}>📚 Обучение</Text>
      <View style={st.statsRow}>
        <View style={st.statCard}><Text style={[st.statVal,{color:'#10b981'}]}>{courses.filter(c=>c.progress?.status==='completed').length}</Text><Text style={st.statLbl}>Пройдено</Text></View>
        <View style={st.statCard}><Text style={[st.statVal,{color:courses.filter(c=>c.isRequired&&c.progress?.status!=='completed').length>0?'#ef4444':'#10b981'}]}>{courses.filter(c=>c.isRequired&&c.progress?.status!=='completed').length}</Text><Text style={st.statLbl}>Обязательных</Text></View>
        <View style={st.statCard}><Text style={[st.statVal,{color:'#3b82f6'}]}>{courses.length}</Text><Text style={st.statLbl}>Всего</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catStrip}>
        <TouchableOpacity style={[st.catBtn,activeCat==='all'&&st.catBtnActive]} onPress={()=>setActiveCat('all')}><Text style={[st.catBtnText,activeCat==='all'&&st.catBtnTextActive]}>Все</Text></TouchableOpacity>
        {cats.map(cat=>(<TouchableOpacity key={cat.id} style={[st.catBtn,activeCat===cat.id&&st.catBtnActive]} onPress={()=>setActiveCat(cat.id)}><Text style={[st.catBtnText,activeCat===cat.id&&st.catBtnTextActive]}>{cat.nameRu}</Text></TouchableOpacity>))}
      </ScrollView>

      {filtered.length===0?<Text style={st.empty}>Нет курсов</Text>:filtered.map(course=>(
        <View key={course.id} style={st.card}>
          <View style={st.cardTop}>
            <View style={{flex:1}}>
              <View style={st.titleRow}><Text style={st.cardTitle}>{course.nameRu}</Text>{course.isRequired&&<Text style={st.reqBadge}>обяз.</Text>}</View>
              {course.descriptionRu&&<Text style={st.cardDesc}>{course.descriptionRu}</Text>}
              <View style={st.cardMeta}><Text style={st.metaText}>⏱ {course.durationMinutes} мин</Text><Text style={st.metaText}>📊 {course.difficulty}</Text></View>
            </View>
            {course.progress&&<View style={[st.progCircle,course.progress.status==='completed'&&st.progDone]}><Text style={st.progText}>{course.progress.percent}%</Text></View>}
          </View>
          {course.progress&&<View style={st.progBar}><View style={[st.progFill,{width:`${course.progress.percent}%`}]}/></View>}
          <View style={st.btnRow}>
            <TouchableOpacity style={st.playBtn} onPress={()=>playVideo(course)}>
              <Text style={st.playBtnText}>{course.videoUrl?'▶️ Смотреть видео':'📝 Начать экзамен'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.examBtn} onPress={()=>startExam(course)}>
              <Text style={st.examBtnText}>📝 Экзамен</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{height:80}}/>

      {/* Video modal */}
      <Modal visible={showVideo} animationType="slide">
        <View style={st.videoContainer}>
          <View style={st.videoHeader}>
            <TouchableOpacity onPress={()=>setShowVideo(false)}><Text style={st.videoClose}>✕ Закрыть</Text></TouchableOpacity>
          </View>
          <WebView source={{uri:videoUrl}} style={{flex:1}} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback/>
        </View>
      </Modal>

      {/* Exam modal */}
      <Modal visible={showExam} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <ScrollView style={st.modal} contentContainerStyle={{paddingBottom:40}}>
            <Text style={st.modalTitle}>{examResult?'Результат':examCourse?.nameRu}</Text>
            {examResult?(
              <View style={st.resultCard}>
                <Text style={[st.resultScore,{color:examResult.passed?'#10b981':'#ef4444'}]}>{examResult.score}%</Text>
                <Text style={[st.resultStatus,{color:examResult.passed?'#10b981':'#ef4444'}]}>{examResult.passed?'✅ Сдан!':'❌ Не сдан'}</Text>
                <Text style={st.resultDetail}>Правильно: {examResult.correctCount}/{examResult.totalQuestions} · Попытка: {examResult.attemptNumber}</Text>
                <TouchableOpacity style={st.closeBtn} onPress={()=>setShowExam(false)}><Text style={st.closeBtnText}>Закрыть</Text></TouchableOpacity>
              </View>
            ):(
              <>
                {questions.map((q,i)=>(<View key={q.id} style={st.qCard}><Text style={st.qNum}>Вопрос {i+1}</Text><Text style={st.qText}>{q.questionTextRu}</Text>{(q.options as string[]).map((opt,oi)=>(<TouchableOpacity key={oi} style={[st.optBtn,answers[q.id]===opt&&st.optActive]} onPress={()=>setAnswers(a=>({...a,[q.id]:opt}))}><Text style={[st.optText,answers[q.id]===opt&&st.optTextActive]}>{String.fromCharCode(65+oi)}. {opt}</Text></TouchableOpacity>))}</View>))}
                <TouchableOpacity style={[st.submitBtn,examLoading&&{opacity:.5}]} onPress={submitExam} disabled={examLoading||questions.length===0}>{examLoading?<ActivityIndicator color="#000"/>:<Text style={st.submitBtnText}>Завершить экзамен</Text>}</TouchableOpacity>
                <TouchableOpacity style={st.cancelExamBtn} onPress={()=>setShowExam(false)}><Text style={st.cancelExamBtnText}>Отмена</Text></TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st=StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},centered:{flex:1,backgroundColor:'#0a0a0a',alignItems:'center',justifyContent:'center'},
  title:{fontSize:22,fontWeight:'700',color:'#fff',marginTop:50,marginBottom:16},
  statsRow:{flexDirection:'row',gap:8,marginBottom:16},
  statCard:{flex:1,backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:12,padding:12,alignItems:'center'},
  statVal:{fontSize:22,fontWeight:'700'},statLbl:{fontSize:10,color:'#666',marginTop:4},
  catStrip:{marginBottom:16},catBtn:{paddingHorizontal:14,paddingVertical:8,borderRadius:8,backgroundColor:'#111',borderWidth:1,borderColor:'#222',marginRight:8},
  catBtnActive:{borderColor:'#10b981',backgroundColor:'#10b98110'},catBtnText:{color:'#888',fontSize:13},catBtnTextActive:{color:'#10b981'},
  empty:{color:'#555',textAlign:'center',padding:48},
  card:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:16,marginBottom:10},
  cardTop:{flexDirection:'row',alignItems:'flex-start'},titleRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4},
  cardTitle:{color:'#fff',fontSize:15,fontWeight:'600',flex:1},reqBadge:{backgroundColor:'#ef444420',color:'#ef4444',fontSize:10,paddingHorizontal:6,paddingVertical:2,borderRadius:4},
  cardDesc:{color:'#888',fontSize:12,marginBottom:8},cardMeta:{flexDirection:'row',gap:12},metaText:{color:'#666',fontSize:11},
  progCircle:{width:44,height:44,borderRadius:22,borderWidth:3,borderColor:'#333',alignItems:'center',justifyContent:'center'},
  progDone:{borderColor:'#10b981'},progText:{color:'#10b981',fontSize:11,fontWeight:'700'},
  progBar:{height:4,backgroundColor:'#222',borderRadius:2,marginTop:10,marginBottom:6},progFill:{height:'100%',backgroundColor:'#10b981',borderRadius:2},
  btnRow:{flexDirection:'row',gap:8,marginTop:8},
  playBtn:{flex:1,padding:10,borderRadius:8,backgroundColor:'#10b98120',alignItems:'center'},playBtnText:{color:'#10b981',fontSize:13,fontWeight:'600'},
  examBtn:{flex:1,padding:10,borderRadius:8,backgroundColor:'#3b82f620',alignItems:'center'},examBtnText:{color:'#3b82f6',fontSize:13,fontWeight:'600'},
  videoContainer:{flex:1,backgroundColor:'#000'},videoHeader:{padding:16,flexDirection:'row',justifyContent:'flex-end'},videoClose:{color:'#fff',fontSize:16},
  modalOverlay:{flex:1,backgroundColor:'#00000080',justifyContent:'flex-end'},modal:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'85%'},
  modalTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8},
  qCard:{marginBottom:20},qNum:{color:'#10b981',fontSize:12,fontWeight:'600',marginBottom:4},qText:{color:'#fff',fontSize:15,fontWeight:'600',marginBottom:10},
  optBtn:{padding:12,borderRadius:8,borderWidth:1,borderColor:'#333',marginBottom:6},optActive:{borderColor:'#10b981',backgroundColor:'#10b98110'},
  optText:{color:'#ccc',fontSize:14},optTextActive:{color:'#10b981',fontWeight:'600'},
  submitBtn:{backgroundColor:'#10b981',padding:16,borderRadius:12,alignItems:'center',marginTop:8},submitBtnText:{color:'#000',fontSize:16,fontWeight:'700'},
  cancelExamBtn:{marginTop:10,padding:12,alignItems:'center'},cancelExamBtnText:{color:'#888',fontSize:14},
  resultCard:{alignItems:'center',paddingVertical:20},resultScore:{fontSize:48,fontWeight:'800',marginBottom:8},resultStatus:{fontSize:18,fontWeight:'700',marginBottom:12},
  resultDetail:{color:'#888',fontSize:14,marginBottom:4},closeBtn:{paddingHorizontal:32,paddingVertical:12,backgroundColor:'#10b98120',borderRadius:10,marginTop:20},closeBtnText:{color:'#10b981',fontSize:15,fontWeight:'600'},
});
