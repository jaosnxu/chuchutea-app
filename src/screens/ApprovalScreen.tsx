
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

const WORKFLOW_TYPES: Record<string,string> = {
  leave_request:'Отпуск', schedule_swap:'Обмен смены', inventory_exception:'Аномалия склада',
  clock_correction:'Коррекция часов', permission_change:'Изменение прав',
  purchase_order:'Заказ', damage_report:'Списание'
};

interface ApprovalItem {
  id:string; workflowType:string; referenceTitle:string; status:string;
  createdAt:string; submitter?:{id:string;firstNameRu:string;lastNameRu:string};
  nodes?:{id:string;stepIndex:number;assigneeRole:string;status:string;comment?:string}[];
}

export default function ApprovalScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ApprovalItem[]>([]);
  const [myRecords, setMyRecords] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my'|'pending'|'history'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectApprovalId, setRejectApprovalId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCustom, setRejectCustom] = useState('');
  const [rejectReasons, setRejectReasons] = useState<{id:string;labelRu:string}[]>([]);
  const [form, setForm] = useState({ workflowType:'leave_request', referenceTitle:'', comment:'' });
  const [statusMsg, setStatusMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(()=>{loadAll()},[]);

  async function loadAll(){
    try{
      const [r1, r2] = await Promise.all([
        authFetch('/approvals?status=pending'),
        authFetch('/approvals?my=true'),
      ]);
      if(r1.ok)setRecords(await r1.json());
      if(r2.ok)setMyRecords(await r2.json());
    }catch{}
    setLoading(false);setRefreshing(false);
  }

  async function submitApproval(){
    setStatusMsg('');
    if(!form.referenceTitle.trim()){setStatusMsg('Введите описание');return;}
    try{
      const res = await authFetch('/approvals',{method:'POST',body:JSON.stringify(form)});
      if(res.ok){setShowCreate(false);setForm({workflowType:'leave_request',referenceTitle:'',comment:''});loadAll();}
      else{const e=await res.json();setStatusMsg('❌ '+(e.error||'Ошибка'));}
    }catch{setStatusMsg('❌ Нет соединения');}
  }

  async function actOnApproval(id:string, approved:boolean){
    if(!approved){ openReject(id); return; }
    try{
      await authFetch(`/approvals/${id}`,{method:'POST',body:JSON.stringify({approved,comment:''})});
      loadAll();
    }catch{}
  }

  async function openReject(id:string){
    setRejectApprovalId(id); setShowReject(true);
    try{ const r=await authFetch('/approvals/reject-reasons'); if(r.ok) setRejectReasons(await r.json()); }catch{}
  }

  async function submitReject(){
    const comment = rejectReason === 'other' ? rejectCustom : (rejectReasons.find(r=>r.id===rejectReason)?.labelRu || rejectCustom);
    try{
      await authFetch(`/approvals/${rejectApprovalId}`,{method:'POST',body:JSON.stringify({approved:false,comment})});
      setShowReject(false); setRejectReason(''); setRejectCustom(''); loadAll();
    }catch{}
  }

  if(loading)return <View style={s.centered}><ActivityIndicator color="#10b981"/></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadAll()}} tintColor="#10b981"/>}>
      <View style={s.header}>
        <Text style={s.title}>✅ Согласования</Text>
        <TouchableOpacity style={s.addBtn} onPress={()=>setShowCreate(true)}><Text style={s.addBtnText}>+ Заявка</Text></TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {(['my','pending','history']as const).map(t=>(
          <TouchableOpacity key={t} style={[s.tab,tab===t&&s.tabActive]} onPress={()=>setTab(t)}>
            <Text style={[s.tabText,tab===t&&s.tabTextActive]}>{t==='my'?'Мои':t==='pending'?'На рассмотрении':'История'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {statusMsg?<Text style={{color:statusMsg.startsWith('❌')?'#ef4444':'#10b981',textAlign:'center',marginBottom:8}}>{statusMsg}</Text>:null}

      {(tab==='my'?myRecords:tab==='pending'?records:records.filter(r=>r.status!=='pending')).length===0?
        <Text style={s.empty}>Нет заявок</Text>:
        (tab==='my'?myRecords:tab==='pending'?records:records.filter(r=>r.status!=='pending')).map(r=>(
          <View key={r.id} style={[s.card, r.status==='approved'&&s.cardApproved, r.status==='rejected'&&s.cardRejected]}>
            <View style={s.cardTop}>
              <View style={{flex:1}}>
                <Text style={s.cardTitle}>{r.referenceTitle}</Text>
                <Text style={s.cardType}>{WORKFLOW_TYPES[r.workflowType]||r.workflowType}</Text>
              </View>
              <Text style={[s.statusBadge,{color:r.status==='approved'?'#10b981':r.status==='rejected'?'#ef4444':'#f59e0b'}]}>
                {r.status==='approved'?'✅ Одобрено':r.status==='rejected'?'❌ Отклонено':'⏳ Ожидает'}
              </Text>
            </View>
            {r.submitter&&<Text style={s.submitter}>От: {r.submitter.firstNameRu} {r.submitter.lastNameRu}</Text>}
            <Text style={s.date}>{new Date(r.createdAt).toLocaleDateString('ru-RU')}</Text>
            {tab==='pending'&&['store_manager','region_manager','ceo','headquarters'].includes(user?.role||'')&&(
              <View style={s.actions}>
                <TouchableOpacity style={s.approveBtn} onPress={()=>actOnApproval(r.id,true)}><Text style={s.approveBtnText}>✅ Одобрить</Text></TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={()=>actOnApproval(r.id,false)}><Text style={s.rejectBtnText}>❌ Отклонить</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Новая заявка</Text>
            <Text style={s.fieldLabel}>Тип</Text>
            <ScrollView style={s.typeList} nestedScrollEnabled>
              {Object.entries(WORKFLOW_TYPES).map(([k,v])=>(
                <TouchableOpacity key={k} style={[s.typeOpt,form.workflowType===k&&s.typeOptActive]} onPress={()=>setForm({...form,workflowType:k})}>
                  <Text style={[s.typeOptText,form.workflowType===k&&s.typeOptTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.fieldLabel}>Описание *</Text>
            <TextInput style={s.input} value={form.referenceTitle} onChangeText={t=>setForm({...form,referenceTitle:t})} placeholder="Причина заявки" placeholderTextColor="#555"/>
            <Text style={s.fieldLabel}>Комментарий</Text>
            <TextInput style={[s.input,s.multiInput]} value={form.comment} onChangeText={t=>setForm({...form,comment:t})} placeholder="Дополнительно" placeholderTextColor="#555" multiline/>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowCreate(false)}><Text style={s.cancelBtnText}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={submitApproval}><Text style={s.saveBtnText}>Отправить</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={showReject} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>❌ Причина отказа</Text>
            <Text style={s.modalHint}>Выберите или введите свою</Text>
            {rejectReasons.map(r => (
              <TouchableOpacity key={r.id}
                style={[s.reasonOption, rejectReason === r.id && s.reasonOptionActive]}
                onPress={() => setRejectReason(r.id)}>
                <Text style={[s.reasonOptionText, rejectReason === r.id && s.reasonOptionTextActive]}>{r.labelRu}</Text>
              </TouchableOpacity>
            ))}
            {rejectReason === 'other' && (
              <TextInput style={[s.input, { marginTop: 8 }]} value={rejectCustom} onChangeText={setRejectCustom}
                placeholder="Введите причину" placeholderTextColor="#555" />
            )}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowReject(false)}>
                <Text style={s.cancelBtnText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#ef4444' }]} onPress={submitReject}>
                <Text style={[s.saveBtnText, { color: '#fff' }]}>Отклонить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s=StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  centered:{flex:1,backgroundColor:'#0a0a0a',alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:50,marginBottom:16},
  title:{fontSize:22,fontWeight:'700',color:'#fff'},
  addBtn:{backgroundColor:'#10b981',paddingHorizontal:16,paddingVertical:8,borderRadius:8},
  addBtnText:{color:'#000',fontWeight:'600',fontSize:14},
  tabRow:{flexDirection:'row',backgroundColor:'#111',borderRadius:10,padding:3,marginBottom:16},
  tab:{flex:1,paddingVertical:8,alignItems:'center',borderRadius:8},
  tabActive:{backgroundColor:'#10b98120'},
  tabText:{color:'#666',fontSize:13},
  tabTextActive:{color:'#10b981',fontWeight:'600'},
  empty:{color:'#555',textAlign:'center',padding:48},
  card:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:16,marginBottom:10},
  cardApproved:{borderColor:'#10b98140'},
  cardRejected:{borderColor:'#ef444440'},
  cardTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  cardTitle:{color:'#fff',fontSize:15,fontWeight:'600'},
  cardType:{color:'#666',fontSize:12,marginTop:2},
  statusBadge:{fontSize:12,fontWeight:'600'},
  submitter:{color:'#888',fontSize:12,marginBottom:2},
  date:{color:'#555',fontSize:11,marginBottom:8},
  actions:{flexDirection:'row',gap:10,marginTop:8},
  approveBtn:{flex:1,padding:12,borderRadius:8,backgroundColor:'#10b98120',alignItems:'center'},
  approveBtnText:{color:'#10b981',fontWeight:'600',fontSize:14},
  rejectBtn:{flex:1,padding:12,borderRadius:8,backgroundColor:'#ef444420',alignItems:'center'},
  rejectBtnText:{color:'#ef4444',fontWeight:'600',fontSize:14},
  modalOverlay:{flex:1,backgroundColor:'#00000080',justifyContent:'flex-end'},
  modal:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'80%'},
  modalTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:16},
  fieldLabel:{color:'#888',fontSize:12,marginBottom:6,marginTop:10},
  typeList:{maxHeight:120,backgroundColor:'#0a0a0a',borderRadius:10,marginBottom:8},
  typeOpt:{padding:10,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  typeOptActive:{backgroundColor:'#10b98110'},
  typeOptText:{color:'#888',fontSize:13},
  typeOptTextActive:{color:'#10b981',fontWeight:'600'},
  input:{backgroundColor:'#0a0a0a',borderWidth:1,borderColor:'#333',borderRadius:8,padding:12,color:'#fff',fontSize:15},
  multiInput:{minHeight:60,textAlignVertical:'top'},
  modalBtns:{flexDirection:'row',gap:12,marginTop:20},
  cancelBtn:{flex:1,padding:14,borderRadius:10,borderWidth:1,borderColor:'#333',alignItems:'center'},
  cancelBtnText:{color:'#aaa',fontSize:15},
  saveBtn:{flex:1,padding:14,borderRadius:10,backgroundColor:'#10b981',alignItems:'center'},
  saveBtnText:{color:'#000',fontSize:15,fontWeight:'600'},
  modalHint:{color:'#666',fontSize:12,marginBottom:12},
  reasonOption:{padding:12,borderRadius:8,backgroundColor:'#0a0a0a',borderWidth:1,borderColor:'#222',marginBottom:6},
  reasonOptionActive:{borderColor:'#ef4444',backgroundColor:'#ef444410'},
  reasonOptionText:{color:'#888',fontSize:14},
  reasonOptionTextActive:{color:'#ef4444',fontWeight:'600'},
});
