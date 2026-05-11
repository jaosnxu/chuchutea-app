
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface RewardItem { id:string; nameRu:string; descriptionRu?:string; itemType:string; pointsCost:number; stockQuantity:number; imageUrl?:string; }
interface PointsRecord { id:string; points:number; reason:string; type:string; createdAt:string; }

export default function PointsScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [earned, setEarned] = useState(0);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem|null>(null);
  const [redeemMsg, setRedeemMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(()=>{loadAll()},[]);

  async function loadAll(){
    try{
      const [ptsRes, recsRes, rwdsRes] = await Promise.all([
        authFetch('/points'),
        authFetch('/points/records'),
        authFetch('/points/rewards'),
      ]);
      if(ptsRes.ok){const d=await ptsRes.json();setBalance(d.totalPoints||0);setEarned(d.earnedThisMonth||0);}
      if(recsRes.ok) setRecords(await recsRes.json());
      if(rwdsRes.ok) setRewards(await rwdsRes.json());
    }catch{}
    setLoading(false);setRefreshing(false);
  }

  async function redeem(){
    if(!selectedReward)return;
    setRedeemMsg('');
    try{
      const res = await authFetch('/points/redeem',{method:'POST',body:JSON.stringify({rewardId:selectedReward.id})});
      const d = await res.json();
      if(res.ok){setRedeemMsg('✅ '+d.message);loadAll();setShowReward(false);}
      else{setRedeemMsg('❌ '+(d.error||'Ошибка'));}
    }catch{setRedeemMsg('❌ Нет соединения');}
  }

  if(loading)return <View style={s.centered}><ActivityIndicator color="#10b981"/></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadAll()}} tintColor="#10b981"/>}>
      <Text style={s.title}>💰 Баллы</Text>

      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Мой баланс</Text>
        <Text style={s.balanceValue}>{balance}</Text>
        <View style={s.balanceRow}>
          <View style={s.balanceItem}><Text style={[s.balanceItemVal,{color:'#10b981'}]}>+{earned}</Text><Text style={s.balanceItemLbl}>в этом месяце</Text></View>
        </View>
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn} onPress={()=>setShowReward(true)}>
          <Text style={s.actionIcon}>🎁</Text><Text style={s.actionText}>Магазин</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <Text style={s.actionIcon}>📜</Text><Text style={s.actionText}>История</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>🎁 Доступные награды</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rewardStrip}>
        {rewards.map(r=>(
          <TouchableOpacity key={r.id} style={s.rewardCard} onPress={()=>{setSelectedReward(r);setRedeemMsg('');setShowReward(true);}}>
            <View style={s.rewardIcon}><Text style={s.rewardIconText}>🎁</Text></View>
            <Text style={s.rewardName}>{r.nameRu}</Text>
            <Text style={s.rewardCost}>{r.pointsCost} баллов</Text>
          </TouchableOpacity>
        ))}
        {rewards.length===0&&<Text style={s.empty}>Нет наград</Text>}
      </ScrollView>

      <Text style={s.sectionTitle}>📜 Последние операции</Text>
      <View style={s.recordList}>
        {records.slice(0,10).map(r=>(
          <View key={r.id} style={s.recordRow}>
            <Text style={[s.recordPts,{color:r.points>0?'#10b981':'#ef4444'}]}>{r.points>0?'+'+r.points:r.points}</Text>
            <Text style={s.recordReason}>{r.reason||r.type}</Text>
            <Text style={s.recordDate}>{new Date(r.createdAt).toLocaleDateString('ru-RU')}</Text>
          </View>
        ))}
        {records.length===0&&<Text style={s.empty}>Нет операций</Text>}
      </View>

      <View style={{height:80}}/>

      <Modal visible={showReward&&selectedReward!==null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            {selectedReward&&<>
              <View style={s.rewardHero}><Text style={s.rewardHeroIcon}>🎁</Text></View>
              <Text style={s.rwName}>{selectedReward.nameRu}</Text>
              {selectedReward.descriptionRu&&<Text style={s.rwDesc}>{selectedReward.descriptionRu}</Text>}
              <Text style={s.rwCost}>{selectedReward.pointsCost} баллов</Text>
              <Text style={s.rwBalance}>Ваш баланс: {balance}</Text>
              {redeemMsg?<Text style={{color:redeemMsg.startsWith('✅')?'#10b981':'#ef4444',textAlign:'center',marginVertical:10,fontSize:14}}>{redeemMsg}</Text>:null}
              <TouchableOpacity style={[s.redeemBtn,balance<selectedReward.pointsCost&&{opacity:.4}]} onPress={redeem} disabled={balance<selectedReward.pointsCost}>
                <Text style={s.redeemBtnText}>{balance>=selectedReward.pointsCost?'Обменять':'Недостаточно баллов'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.closeBtn} onPress={()=>setShowReward(false)}><Text style={s.closeBtnText}>Закрыть</Text></TouchableOpacity>
            </>}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s=StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  centered:{flex:1,backgroundColor:'#0a0a0a',alignItems:'center',justifyContent:'center'},
  title:{fontSize:22,fontWeight:'700',color:'#fff',marginTop:50,marginBottom:16},
  balanceCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#10b98130',borderRadius:16,padding:20,alignItems:'center',marginBottom:16},
  balanceLabel:{color:'#888',fontSize:13,marginBottom:8},
  balanceValue:{fontSize:48,fontWeight:'800',color:'#10b981'},
  balanceRow:{flexDirection:'row',gap:24,marginTop:12},
  balanceItem:{alignItems:'center'},
  balanceItemVal:{fontSize:18,fontWeight:'700'},
  balanceItemLbl:{fontSize:11,color:'#666',marginTop:2},
  actionsRow:{flexDirection:'row',gap:10,marginBottom:24},
  actionBtn:{flex:1,backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:18,alignItems:'center'},
  actionIcon:{fontSize:28,marginBottom:6},
  actionText:{fontSize:13,color:'#aaa'},
  sectionTitle:{fontSize:14,color:'#888',marginBottom:10},
  rewardStrip:{marginBottom:24},
  rewardCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:14,width:130,marginRight:10,alignItems:'center'},
  rewardIcon:{width:50,height:50,borderRadius:25,backgroundColor:'#10b98110',alignItems:'center',justifyContent:'center',marginBottom:8},
  rewardIconText:{fontSize:24},
  rewardName:{color:'#fff',fontSize:12,fontWeight:'600',textAlign:'center',marginBottom:4},
  rewardCost:{color:'#10b981',fontSize:12,fontWeight:'700'},
  empty:{color:'#555',textAlign:'center',padding:20,fontSize:13},
  recordList:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,overflow:'hidden',marginBottom:30},
  recordRow:{flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  recordPts:{fontSize:15,fontWeight:'700',width:50},
  recordReason:{color:'#ccc',fontSize:13,flex:1},
  recordDate:{color:'#555',fontSize:11},
  modalOverlay:{flex:1,backgroundColor:'#00000080',justifyContent:'flex-end'},
  modal:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,alignItems:'center'},
  rewardHero:{width:80,height:80,borderRadius:40,backgroundColor:'#10b98110',alignItems:'center',justifyContent:'center',marginBottom:16},
  rewardHeroIcon:{fontSize:36},
  rwName:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8},
  rwDesc:{fontSize:13,color:'#888',textAlign:'center',marginBottom:12},
  rwCost:{fontSize:22,fontWeight:'700',color:'#10b981',marginBottom:8},
  rwBalance:{fontSize:13,color:'#666',marginBottom:16},
  redeemBtn:{backgroundColor:'#10b981',paddingHorizontal:40,paddingVertical:14,borderRadius:12,marginBottom:10},
  redeemBtnText:{color:'#000',fontSize:15,fontWeight:'700'},
  closeBtn:{padding:12},
  closeBtnText:{color:'#888',fontSize:14},
});
