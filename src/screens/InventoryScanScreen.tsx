
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';

interface Product { barcode:string; nameRu:string; unit:string; quantity:number; }

const MOCK_CATALOG: Record<string,{nameRu:string;unit:string;quantity?:number}> = {
  '4601234567890':{nameRu:'Чай зелёный жасмин 1кг',unit:'уп',quantity:23},'4601234567891':{nameRu:'Молоко кокосовое 1л',unit:'шт',quantity:45},
  '4601234567892':{nameRu:'Сироп манго 500мл',unit:'шт',quantity:18},'4601234567893':{nameRu:'Жемчуг тапиока 3кг',unit:'меш',quantity:10},
  '4601234567894':{nameRu:'Сахар тростниковый 1кг',unit:'уп',quantity:32},'4601234567895':{nameRu:'Сливки растительные 1л',unit:'шт',quantity:27},
};

export default function InventoryScanScreen() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<Product|null>(null);
  const [mode, setMode] = useState<'in'|'out'>('out');
  const [quantity, setQuantity] = useState('1');
  const [statusMsg, setStatusMsg] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAnomaly, setShowAnomaly] = useState(false);
  const [anomalyReason, setAnomalyReason] = useState('');
  const [resultModal, setResultModal] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  function scanBarcode(code:string){
    setBarcode(code);setStatusMsg('');setProduct(null);setScanning(true);
    const local = MOCK_CATALOG[code];
    authFetch('/inventory/scan?barcode='+code).then(async r=>{
      if(r.ok){const d=await r.json();setProduct(d.product);}
      else if(local) setProduct({barcode:code,...local,quantity:local.quantity||0});
      setScanning(false);
    }).catch(()=>{if(local)setProduct({barcode:code,...local,quantity:local.quantity||0});setScanning(false);});
  }

  const handleCameraScan = useCallback((code: string) => {
    setShowCamera(false);
    scanBarcode(code);
  }, []);

  async function executeOperation(isAnomaly=false){
    const qty=parseInt(quantity);if(!qty||qty<=0){setStatusMsg('Введите количество');return;}
    if(isAnomaly&&!anomalyReason.trim()){setStatusMsg('Укажите причину');return;}
    setScanning(true);setStatusMsg('');
    try{
      const r=await authFetch('/inventory/scan',{method:'POST',body:JSON.stringify({barcode,type:mode,quantity:qty,isAnomaly,anomalyReason:isAnomaly?anomalyReason:'',orgId:user?.orgId||'s-001'})});
      const d=await r.json();
      if(r.ok){setLastResult(d);setResultModal(true);setBarcode('');setProduct(null);setQuantity('1');setAnomalyReason('');}
      else setStatusMsg('❌ '+(d.error||'Ошибка'));
    }catch{setStatusMsg('❌ Нет соединения');}
    setScanning(false);
  }

  return (
    <ScrollView style={ct.container}>
      <Text style={ct.title}>📦 Склад</Text>
      <View style={ct.modeRow}>
        <TouchableOpacity style={[ct.modeBtn,mode==='out'&&ct.modeBtnOut]} onPress={()=>setMode('out')}><Text style={[ct.modeBtnText,mode==='out'&&ct.modeBtnTextOut]}>📤 Расход</Text></TouchableOpacity>
        <TouchableOpacity style={[ct.modeBtn,mode==='in'&&ct.modeBtnIn]} onPress={()=>setMode('in')}><Text style={[ct.modeBtnText,mode==='in'&&ct.modeBtnTextIn]}>📥 Приход</Text></TouchableOpacity>
      </View>

      {/* 🔴 NEW: три способа сканирования */}
      <View style={ct.scanMethodRow}>
        <TouchableOpacity style={ct.cameraScanBig} onPress={() => setShowCamera(true)}>
          <Text style={ct.cameraScanIcon}>📷</Text>
          <Text style={ct.cameraScanLabel}>Сканировать камерой</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ct.catalogBtnBig} onPress={() => setShowCatalog(true)}>
          <Text style={ct.catalogBtnIcon}>📋</Text>
          <Text style={ct.catalogBtnLabel}>Выбрать из каталога</Text>
        </TouchableOpacity>
      </View>

      <View style={ct.divider}>
        <View style={ct.dividerLine} />
        <Text style={ct.dividerText}>или введите вручную</Text>
        <View style={ct.dividerLine} />
      </View>

      <Text style={ct.fieldLabel}>Штрихкод</Text>
      <View style={ct.scanRow}>
        <TextInput style={[ct.input,{flex:1}]} value={barcode} onChangeText={setBarcode} placeholder="Отсканируйте" placeholderTextColor="#555" keyboardType="numeric" onSubmitEditing={()=>scanBarcode(barcode)}/>
      </View>
      <TouchableOpacity style={ct.scanBtn} onPress={()=>scanBarcode(barcode)} disabled={!barcode||scanning}>
        {scanning?<ActivityIndicator color="#000"/>:<Text style={ct.scanBtnText}>🔍 Найти</Text>}
      </TouchableOpacity>

      {product&&(
        <View style={ct.productCard}>
          <View style={ct.productHeader}>
            <View style={{flex:1}}><Text style={ct.productName}>{product.nameRu}</Text><Text style={ct.productMeta}>{product.barcode} · {product.unit}</Text></View>
            <View style={ct.qtyBadge}><Text style={ct.qtyBadgeText}>{product.quantity}</Text><Text style={ct.qtyBadgeUnit}>{product.unit}</Text></View>
          </View>
          <Text style={ct.fieldLabel}>Количество</Text>
          <View style={ct.qtyRow}>
            <TouchableOpacity style={ct.qtyBtn} onPress={()=>setQuantity(String(Math.max(1,parseInt(quantity)-1)))}><Text style={ct.qtyBtnText}>−</Text></TouchableOpacity>
            <TextInput style={ct.qtyInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" textAlign="center"/>
            <TouchableOpacity style={ct.qtyBtn} onPress={()=>setQuantity(String(parseInt(quantity)+1))}><Text style={ct.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
          {statusMsg?<Text style={{color:statusMsg.startsWith('❌')?'#ef4444':'#10b981',textAlign:'center',marginTop:8,fontSize:14}}>{statusMsg}</Text>:null}
          <View style={ct.actionRow}>
            <TouchableOpacity style={[ct.actionBtn,ct.actionBtnMain]} onPress={()=>executeOperation(false)} disabled={scanning}><Text style={ct.actionBtnText}>{mode==='out'?'📤 Списать':'📥 Оприходовать'} {quantity} {product.unit}</Text></TouchableOpacity>
            {mode==='out'&&<TouchableOpacity style={[ct.actionBtn,ct.actionBtnAnomaly]} onPress={()=>setShowAnomaly(true)}><Text style={[ct.actionBtnText,{color:'#ef4444'}]}>⚠️ Аномалия</Text></TouchableOpacity>}
          </View>
        </View>
      )}

      {/* Camera Scanner Modal */}
      <BarcodeScanner visible={showCamera} onClose={() => setShowCamera(false)} onScan={handleCameraScan} />

      <Modal visible={showCatalog} transparent animationType="slide">
        <View style={ct.modalOverlay}><View style={ct.modal}>
          <Text style={ct.modalTitle}>Каталог товаров</Text>
          <Text style={ct.modalHint}>Нажмите для выбора</Text>
          {Object.entries(MOCK_CATALOG).map(([code,item])=>(
            <TouchableOpacity key={code} style={[ct.catItem,barcode===code&&ct.catItemActive]} onPress={()=>{setShowCatalog(false);scanBarcode(code);}}>
              <Text style={ct.catItemName}>{item.nameRu}</Text>
              <Text style={ct.catItemMeta}>{item.quantity} {item.unit} · {code.slice(-4)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={ct.closeBtn} onPress={()=>setShowCatalog(false)}><Text style={ct.closeBtnText}>Закрыть</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={showAnomaly} transparent animationType="slide">
        <View style={ct.modalOverlay}><View style={ct.modal}>
          <Text style={ct.modalTitle}>Аномалия списания</Text>
          <Text style={ct.modalDesc}>{product?.nameRu} · {quantity} {product?.unit}</Text>
          <Text style={ct.fieldLabel}>Причина *</Text>
          <TextInput style={[ct.input,ct.multiInput]} value={anomalyReason} onChangeText={setAnomalyReason} placeholder="Несоответствие, повреждение..." placeholderTextColor="#555" multiline/>
          <View style={ct.modalBtns}>
            <TouchableOpacity style={ct.cancelBtn} onPress={()=>{setShowAnomaly(false);setAnomalyReason('');}}><Text style={ct.cancelBtnText}>Отмена</Text></TouchableOpacity>
            <TouchableOpacity style={ct.anomalySubmitBtn} onPress={()=>{setShowAnomaly(false);executeOperation(true);}}><Text style={ct.anomalySubmitText}>Отправить</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={resultModal} transparent animationType="fade">
        <View style={ct.resultOverlay}><View style={ct.resultCard}>
          <Text style={ct.resultIcon}>{lastResult?.isAnomaly?'⚠️':'✅'}</Text>
          <Text style={ct.resultTitle}>{lastResult?.isAnomaly?'Аномалия':'Готово'}</Text>
          <Text style={ct.resultProduct}>{lastResult?.product?.nameRu}</Text>
          <Text style={ct.resultQty}>{lastResult?.type==='out'?'−':'+'}{lastResult?.quantity} {lastResult?.product?.unit}</Text>
          <Text style={ct.resultStock}>Остаток: {lastResult?.product?.quantity}</Text>
          {lastResult?.isAnomaly&&<Text style={ct.resultAnomalyNote}>Заявка отправлена менеджеру</Text>}
          <Text style={ct.resultPoints}>+2 балла</Text>
          <TouchableOpacity style={ct.resultCloseBtn} onPress={()=>setResultModal(false)}><Text style={ct.resultCloseText}>OK</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <View style={{height:80}}/>
    </ScrollView>
  );
}

const ct=StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'700',color:'#fff',marginTop:50,marginBottom:16},
  modeRow:{flexDirection:'row',gap:10,marginBottom:16},modeBtn:{flex:1,padding:14,borderRadius:10,backgroundColor:'#111',borderWidth:1,borderColor:'#222',alignItems:'center'},
  modeBtnOut:{borderColor:'#f59e0b',backgroundColor:'#f59e0b10'},modeBtnIn:{borderColor:'#10b981',backgroundColor:'#10b98110'},
  modeBtnText:{color:'#888',fontSize:15,fontWeight:'600'},modeBtnTextOut:{color:'#f59e0b'},modeBtnTextIn:{color:'#10b981'},
  scanMethodRow:{flexDirection:'row',gap:10,marginBottom:16},
  cameraScanBig:{flex:1,backgroundColor:'#10b98115',borderWidth:2,borderColor:'#10b981',borderRadius:14,padding:20,alignItems:'center',justifyContent:'center',borderStyle:'dashed'},
  cameraScanIcon:{fontSize:32,marginBottom:8},
  cameraScanLabel:{color:'#10b981',fontSize:14,fontWeight:'700'},
  catalogBtnBig:{flex:1,backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:14,padding:20,alignItems:'center',justifyContent:'center'},
  catalogBtnIcon:{fontSize:28,marginBottom:6},
  catalogBtnLabel:{color:'#888',fontSize:13},
  divider:{flexDirection:'row',alignItems:'center',marginBottom:16},
  dividerLine:{flex:1,height:1,backgroundColor:'#222'},
  dividerText:{color:'#555',fontSize:11,paddingHorizontal:12},
  fieldLabel:{color:'#888',fontSize:12,marginBottom:6,marginTop:12},
  scanRow:{flexDirection:'row',alignItems:'center',gap:8},
  input:{backgroundColor:'#111',borderWidth:1,borderColor:'#333',borderRadius:10,padding:14,color:'#fff',fontSize:16},
  multiInput:{minHeight:60,textAlignVertical:'top'},
  scanBtn:{backgroundColor:'#10b981',padding:14,borderRadius:10,alignItems:'center',marginTop:8},
  scanBtnText:{color:'#000',fontWeight:'700',fontSize:15},
  productCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:16,padding:16,marginTop:12},
  productHeader:{flexDirection:'row',alignItems:'flex-start',marginBottom:16},
  productName:{color:'#fff',fontSize:16,fontWeight:'600'},productMeta:{color:'#666',fontSize:12},
  qtyBadge:{backgroundColor:'#10b98110',borderWidth:2,borderColor:'#10b981',borderRadius:12,paddingHorizontal:12,paddingVertical:8,alignItems:'center'},
  qtyBadgeText:{color:'#10b981',fontSize:22,fontWeight:'800'},qtyBadgeUnit:{color:'#10b981',fontSize:10},
  qtyRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},qtyBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#222',alignItems:'center',justifyContent:'center'},
  qtyBtnText:{color:'#fff',fontSize:22,fontWeight:'600'},qtyInput:{backgroundColor:'#111',borderWidth:1,borderColor:'#333',borderRadius:10,padding:12,color:'#fff',fontSize:20,fontWeight:'700',width:80,textAlign:'center'},
  actionRow:{marginTop:16,gap:10},actionBtn:{padding:14,borderRadius:10,alignItems:'center'},actionBtnMain:{backgroundColor:'#10b981'},
  actionBtnAnomaly:{backgroundColor:'#ef444420',borderWidth:1,borderColor:'#ef444440'},actionBtnText:{color:'#000',fontSize:15,fontWeight:'700'},
  modalOverlay:{flex:1,backgroundColor:'#00000080',justifyContent:'flex-end'},modal:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'80%'},
  modalTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8},modalHint:{color:'#666',fontSize:12,marginBottom:12},
  modalDesc:{color:'#888',fontSize:13,marginBottom:4},
  catItem:{padding:12,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},catItemActive:{backgroundColor:'#10b98110'},
  catItemName:{color:'#ccc',fontSize:14},catItemMeta:{color:'#666',fontSize:11,marginTop:2},
  closeBtn:{marginTop:16,padding:12,alignItems:'center'},closeBtnText:{color:'#888',fontSize:14},
  modalBtns:{flexDirection:'row',gap:12,marginTop:20},cancelBtn:{flex:1,padding:14,borderRadius:10,borderWidth:1,borderColor:'#333',alignItems:'center'},cancelBtnText:{color:'#aaa',fontSize:15},
  anomalySubmitBtn:{flex:1,padding:14,borderRadius:10,backgroundColor:'#ef4444',alignItems:'center'},anomalySubmitText:{color:'#fff',fontSize:15,fontWeight:'700'},
  resultOverlay:{flex:1,backgroundColor:'#00000080',alignItems:'center',justifyContent:'center'},
  resultCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:20,padding:32,alignItems:'center',marginHorizontal:32},
  resultIcon:{fontSize:56,marginBottom:12},resultTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8,textAlign:'center'},
  resultProduct:{color:'#ccc',fontSize:14},resultQty:{fontSize:22,fontWeight:'800',color:'#10b981',marginVertical:8},
  resultStock:{color:'#666',fontSize:12},resultAnomalyNote:{color:'#f59e0b',fontSize:12,textAlign:'center',marginTop:4},resultPoints:{color:'#10b981',fontSize:12,marginTop:8},
  resultCloseBtn:{marginTop:20,paddingHorizontal:40,paddingVertical:12,backgroundColor:'#10b98120',borderRadius:10},resultCloseText:{color:'#10b981',fontSize:15,fontWeight:'600'},
});
