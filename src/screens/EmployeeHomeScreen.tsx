
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface DashboardData { points?:number; pendingTasks?:number; pendingCourses?:number; level?:{code:string;name:string}; todayShift?:{start:string;end:string;type:string}; }

export default function EmployeeHomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await authFetch('/employee/dashboard');
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  if (loading) return <View style={s.centered}><ActivityIndicator color="#10b981"/></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadData()}} tintColor="#10b981"/>}>
      <Text style={s.greeting}>Привет, {user?.name?.split(' ')[0] || '...'}</Text>
      <Text style={s.role}>{data.level?.code || ''} · {data.level?.name || ''}</Text>

      {data.todayShift && (
        <View style={s.shiftCard}>
          <Text style={s.shiftTitle}>🕐 Сегодняшняя смена</Text>
          <Text style={s.shiftTime}>{data.todayShift.start} – {data.todayShift.end}</Text>
        </View>
      )}

      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={[s.statVal,{color:'#10b981'}]}>{data.points||0}</Text><Text style={s.statLbl}>💰 Баллы</Text></View>
        <View style={s.statCard}><Text style={[s.statVal,{color:'#f59e0b'}]}>{data.pendingTasks||0}</Text><Text style={s.statLbl}>📋 Задачи</Text></View>
        <View style={s.statCard}><Text style={[s.statVal,{color:'#60a5fa'}]}>{data.pendingCourses||0}</Text><Text style={s.statLbl}>📚 Курсы</Text></View>
      </View>

      <Text style={s.sectionTitle}>Быстрые действия</Text>
      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn}><Text style={s.actionIcon}>📷</Text><Text style={s.actionText}>Сканировать</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}><Text style={s.actionIcon}>⏰</Text><Text style={s.actionText}>Отметиться</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}><Text style={s.actionIcon}>📚</Text><Text style={s.actionText}>Обучение</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}><Text style={s.actionIcon}>💰</Text><Text style={s.actionText}>Баллы</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  centered:{flex:1,backgroundColor:'#0a0a0a',alignItems:'center',justifyContent:'center'},
  greeting:{fontSize:24,fontWeight:'700',color:'#fff',marginTop:50},
  role:{fontSize:14,color:'#10b981',marginTop:4,marginBottom:20},
  shiftCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#10b98130',borderRadius:14,padding:16,marginBottom:16},
  shiftTitle:{fontSize:13,color:'#888',marginBottom:6},
  shiftTime:{fontSize:20,fontWeight:'700',color:'#10b981'},
  statsRow:{flexDirection:'row',gap:10,marginBottom:24},
  statCard:{flex:1,backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:14,alignItems:'center'},
  statVal:{fontSize:22,fontWeight:'700'},
  statLbl:{fontSize:11,color:'#666',marginTop:4},
  sectionTitle:{fontSize:14,color:'#888',marginBottom:12},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:30},
  actionBtn:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:18,width:'47.5%',alignItems:'center'},
  actionIcon:{fontSize:28,marginBottom:6},
  actionText:{fontSize:13,color:'#aaa'},
});
