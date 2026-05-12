
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface DashboardData {
  totalEmployees: number; onShiftToday: number; checkedInToday: number;
  lateToday: number; pendingApprovals: number; activeTasks: number;
}

export default function ManagerHomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await authFetch('/manager/dashboard');
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false); setRefreshing(false);
  }

  if (loading) return <View style={s.centered}><ActivityIndicator color="#10b981"/></View>;

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadData()}} tintColor="#10b981"/>}>
      <Text style={s.greeting}>Привет, {user?.name?.split(' ')[0] || '...'}</Text>
      <Text style={s.role}>Менеджер магазина</Text>

      <Text style={s.sectionTitle}>📊 Сегодня</Text>
      <View style={s.statGrid}>
        <View style={[s.statCard,{borderLeftColor:'#10b981'}]}>
          <Text style={[s.statVal,{color:'#10b981'}]}>{data?.checkedInToday||0}/{data?.onShiftToday||0}</Text>
          <Text style={s.statLbl}>На смене</Text>
        </View>
        <View style={[s.statCard,{borderLeftColor:'#f59e0b'}]}>
          <Text style={[s.statVal,{color:'#f59e0b'}]}>{data?.lateToday||0}</Text>
          <Text style={s.statLbl}>Опоздали</Text>
        </View>
        <View style={[s.statCard,{borderLeftColor:'#3b82f6'}]}>
          <Text style={[s.statVal,{color:'#3b82f6'}]}>{data?.pendingApprovals||0}</Text>
          <Text style={s.statLbl}>На согласовании</Text>
        </View>
        <View style={[s.statCard,{borderLeftColor:'#ef4444'}]}>
          <Text style={[s.statVal,{color:'#ef4444'}]}>{data?.activeTasks||0}</Text>
          <Text style={s.statLbl}>Активных задач</Text>
        </View>
      </View>

      <View style={s.infoRow}>
        <View style={s.infoCard}><Text style={s.infoVal}>{data?.totalEmployees||0}</Text><Text style={s.infoLbl}>Всего сотрудников</Text></View>
      </View>

      <Text style={s.sectionTitle}>📋 Управление</Text>
      <View style={s.menuList}>
        <View style={s.menuItem}><Text style={s.menuIcon}>📅</Text><Text style={s.menuText}>График смен</Text><Text style={s.menuArrow}>→</Text></View>
        <View style={s.menuItem}><Text style={s.menuIcon}>✅</Text><Text style={s.menuText}>Согласования</Text><Text style={s.menuArrow}>→</Text></View>
        <View style={s.menuItem}><Text style={s.menuIcon}>📋</Text><Text style={s.menuText}>Задачи</Text><Text style={s.menuArrow}>→</Text></View>
        <View style={s.menuItem}><Text style={s.menuIcon}>📦</Text><Text style={s.menuText}>Склад</Text><Text style={s.menuArrow}>→</Text></View>
        <View style={s.menuItem}><Text style={s.menuIcon}>⏰</Text><Text style={s.menuText}>Посещаемость</Text><Text style={s.menuArrow}>→</Text></View>
      </View>

      <Text style={s.version}>CHUCHUTEA v0.1.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  centered:{flex:1,backgroundColor:'#0a0a0a',alignItems:'center',justifyContent:'center'},
  greeting:{fontSize:24,fontWeight:'700',color:'#fff',marginTop:50},
  role:{fontSize:14,color:'#10b981',marginBottom:20},
  sectionTitle:{fontSize:14,color:'#888',marginBottom:12,marginTop:8},
  statGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16},
  statCard:{flex:1,minWidth:'45%',backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,borderLeftWidth:3,padding:14},
  statVal:{fontSize:22,fontWeight:'700'},
  statLbl:{fontSize:11,color:'#666',marginTop:4},
  infoRow:{flexDirection:'row',gap:8,marginBottom:16},
  infoCard:{flex:1,backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:12,padding:12,alignItems:'center'},
  infoVal:{fontSize:18,fontWeight:'700',color:'#fff'},
  infoLbl:{fontSize:10,color:'#666',marginTop:4},
  menuList:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,overflow:'hidden',marginBottom:24},
  menuItem:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  menuIcon:{fontSize:18,marginRight:12},
  menuText:{fontSize:15,color:'#ccc',flex:1},
  menuArrow:{fontSize:14,color:'#444'},
  version:{textAlign:'center',color:'#333',fontSize:11,marginBottom:24},
});
