// CHUCHUTEA — Inventory Scan Screen (barcode scan + in/out + anomaly)
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { useAuth, authFetch } from '../contexts/AuthContext';

interface Product {
  barcode: string; nameRu: string; unit: string; quantity: number;
}

const MOCK_CATALOG: Record<string, { nameRu: string; unit: string; quantity?: number }> = {
  '4601234567890': { nameRu:'Чай зелёный жасмин 1кг', unit:'уп', quantity:23 },
  '4601234567891': { nameRu:'Молоко кокосовое 1л', unit:'шт', quantity:45 },
  '4601234567892': { nameRu:'Сироп манго 500мл', unit:'шт', quantity:18 },
  '4601234567893': { nameRu:'Жемчуг тапиока 3кг', unit:'меш', quantity:10 },
  '4601234567894': { nameRu:'Сахар тростниковый 1кг', unit:'уп', quantity:32 },
  '4601234567895': { nameRu:'Сливки растительные 1л', unit:'шт', quantity:27 },
  '4601234567896': { nameRu:'Матча порошок 500г', unit:'банка', quantity:8 },
  '4601234567897': { nameRu:'Стакан 500мл', unit:'кор', quantity:200 },
  '4601234567898': { nameRu:'Крышка 90мм', unit:'кор', quantity:350 },
  '4601234567899': { nameRu:'Лёд пищевой 5кг', unit:'меш', quantity:15 },
};

export default function InventoryScanScreen() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<'in'|'out'>('out');
  const [quantity, setQuantity] = useState('1');
  const [statusMsg, setStatusMsg] = useState('');
  const [showAnomaly, setShowAnomaly] = useState(false);
  const [anomalyReason, setAnomalyReason] = useState('');
  const [resultModal, setResultModal] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Demo: quick select from catalog
  function scanBarcode(code: string) {
    setBarcode(code); setStatusMsg(''); setProduct(null);
    setScanning(true);

    // Try backend first, fallback to mock
    authFetch(`/inventory/scan?barcode=${code}`).then(async r => {
      if (r.ok) {
        const d = await r.json();
        setProduct(d.product);
      } else {
        // Fallback to local mock
        const local = MOCK_CATALOG[code];
        if (local) setProduct({ barcode: code, ...local, quantity: local.quantity || 0 });
      }
      setScanning(false);
    }).catch(() => {
      const local = MOCK_CATALOG[code];
      if (local) setProduct({ barcode: code, ...local, quantity: local.quantity || 0 });
      setScanning(false);
    });
  }

  async function executeOperation(isAnomaly = false) {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setStatusMsg('Введите количество'); return; }
    if (isAnomaly && !anomalyReason.trim()) { setStatusMsg('Укажите причину'); return; }
    if (!isAnomaly && mode === 'out' && product && product.quantity < qty) {
      setStatusMsg(`Недостаточно! В наличии: ${product.quantity} ${product.unit}`);
      return;
    }

    setStatusMsg(''); setScanning(true);
    try {
      const res = await authFetch('/inventory/scan', {
        method: 'POST',
        body: JSON.stringify({
          barcode, type: mode, quantity: qty, isAnomaly,
          anomalyPhoto: null, anomalyReason: isAnomaly ? anomalyReason : '',
          orgId: user?.orgId || 's-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastResult(data);
        setResultModal(true);
        setBarcode(''); setProduct(null); setQuantity('1'); setAnomalyReason('');
      } else {
        setStatusMsg('❌ ' + (data.error || 'Ошибка'));
      }
    } catch { setStatusMsg('❌ Нет соединения'); }
    setScanning(false);
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>📦 Склад</Text>

      {/* Mode selector */}
      <View style={s.modeRow}>
        <TouchableOpacity style={[s.modeBtn, mode==='out'&&s.modeBtnOut]} onPress={()=>setMode('out')}>
          <Text style={[s.modeBtnText, mode==='out'&&s.modeBtnTextOut]}>📤 Расход</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.modeBtn, mode==='in'&&s.modeBtnIn]} onPress={()=>setMode('in')}>
          <Text style={[s.modeBtnText, mode==='in'&&s.modeBtnTextIn]}>📥 Приход</Text>
        </TouchableOpacity>
      </View>

      {/* Barcode input + quick select */}
      <Text style={s.fieldLabel}>Штрихкод</Text>
      <TextInput style={s.input} value={barcode} onChangeText={setBarcode} placeholder="Отсканируйте или введите" placeholderTextColor="#555" keyboardType="numeric" onSubmitEditing={()=>scanBarcode(barcode)}/>
      <TouchableOpacity style={s.scanBtn} onPress={()=>scanBarcode(barcode)} disabled={!barcode||scanning}>
        {scanning ? <ActivityIndicator color="#000"/> : <Text style={s.scanBtnText}>🔍 Найти товар</Text>}
      </TouchableOpacity>

      {/* Quick catalog */}
      <Text style={s.fieldLabel}>Быстрый выбор</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catalogStrip}>
        {Object.entries(MOCK_CATALOG).map(([code, item]) => (
          <TouchableOpacity key={code} style={[s.catalogItem, barcode===code&&s.catalogItemActive]} onPress={()=>scanBarcode(code)}>
            <Text style={s.catalogItemName}>{item.nameRu.split(' ').slice(0,2).join(' ')}</Text>
            <Text style={s.catalogItemQty}>{item.quantity} {item.unit}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product info */}
      {product && (
        <View style={s.productCard}>
          <View style={s.productHeader}>
            <View style={{flex:1}}>
              <Text style={s.productName}>{product.nameRu}</Text>
              <Text style={s.productMeta}>{product.barcode} · {product.unit}</Text>
            </View>
            <View style={s.qtyBadge}>
              <Text style={s.qtyBadgeText}>{product.quantity}</Text>
              <Text style={s.qtyBadgeUnit}>{product.unit}</Text>
            </View>
          </View>

          <Text style={s.fieldLabel}>Количество</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={()=>setQuantity(String(Math.max(1,parseInt(quantity)-1)))}>
              <Text style={s.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput style={s.qtyInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" textAlign="center"/>
            <TouchableOpacity style={s.qtyBtn} onPress={()=>setQuantity(String(parseInt(quantity)+1))}>
              <Text style={s.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {statusMsg ? <Text style={{color:statusMsg.startsWith('❌')?'#ef4444':'#10b981',textAlign:'center',marginTop:8,fontSize:14}}>{statusMsg}</Text> : null}

          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actionBtn, s.actionBtnMain]} onPress={()=>executeOperation(false)} disabled={scanning}>
              <Text style={s.actionBtnText}>{mode==='out'?'📤 Списать':'📥 Оприходовать'} {quantity} {product.unit}</Text>
            </TouchableOpacity>
            {mode==='out' && (
              <TouchableOpacity style={[s.actionBtn, s.actionBtnAnomaly]} onPress={()=>setShowAnomaly(true)}>
                <Text style={[s.actionBtnText,{color:'#ef4444'}]}>⚠️ Аномалия</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {!product && !scanning && (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>📷</Text>
          <Text style={s.emptyText}>Отсканируйте штрихкод{'\n'}или выберите товар из каталога</Text>
          <Text style={s.emptyHint}>Тестовые коды: 4601234567890-4601234567899</Text>
        </View>
      )}

      {/* Anomaly modal */}
      <Modal visible={showAnomaly} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Аномалия списания</Text>
            <Text style={s.modalDesc}>Товар: {product?.nameRu}</Text>
            <Text style={s.modalDesc}>Количество: {quantity} {product?.unit}</Text>
            <Text style={s.modalDesc}>Текущий остаток: {product?.quantity}</Text>
            <Text style={s.fieldLabel}>Причина *</Text>
            <TextInput style={[s.input, s.multiInput]} value={anomalyReason} onChangeText={setAnomalyReason} placeholder="Несоответствие, повреждение..." placeholderTextColor="#555" multiline/>
            <Text style={s.anomalyNote}>⚠️ Будет создана заявка на согласование менеджеру</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>{setShowAnomaly(false);setAnomalyReason('');}}><Text style={s.cancelBtnText}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={s.anomalySubmitBtn} onPress={()=>{setShowAnomaly(false);executeOperation(true);}}><Text style={s.anomalySubmitText}>Отправить</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result modal */}
      <Modal visible={resultModal} transparent animationType="fade">
        <View style={s.resultOverlay}>
          <View style={s.resultCard}>
            <Text style={s.resultIcon}>{lastResult?.isAnomaly?'⚠️':'✅'}</Text>
            <Text style={s.resultTitle}>{lastResult?.isAnomaly?'Аномалия зафиксирована':'Операция выполнена'}</Text>
            <Text style={s.resultProduct}>{lastResult?.product?.nameRu}</Text>
            <Text style={s.resultQty}>{lastResult?.type==='out'?'−':'+'}{lastResult?.quantity} {lastResult?.product?.unit}</Text>
            <Text style={s.resultStock}>Остаток: {lastResult?.product?.quantity} → {lastResult?.product?.previousQuantity && lastResult?.product?.quantity}</Text>
            {lastResult?.isAnomaly && <Text style={s.resultAnomalyNote}>Заявка на согласование отправлена менеджеру</Text>}
            <Text style={s.resultPoints}>+2 балла за операцию</Text>
            <TouchableOpacity style={s.resultCloseBtn} onPress={()=>setResultModal(false)}>
              <Text style={s.resultCloseText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s=StyleSheet.create({
  container:{flex:1,backgroundColor:'#0a0a0a',paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'700',color:'#fff',marginTop:50,marginBottom:16},
  modeRow:{flexDirection:'row',gap:10,marginBottom:20},
  modeBtn:{flex:1,padding:14,borderRadius:10,backgroundColor:'#111',borderWidth:1,borderColor:'#222',alignItems:'center'},
  modeBtnOut:{borderColor:'#f59e0b',backgroundColor:'#f59e0b10'},
  modeBtnIn:{borderColor:'#10b981',backgroundColor:'#10b98110'},
  modeBtnText:{color:'#888',fontSize:15,fontWeight:'600'},
  modeBtnTextOut:{color:'#f59e0b'},
  modeBtnTextIn:{color:'#10b981'},
  fieldLabel:{color:'#888',fontSize:12,marginBottom:6,marginTop:12},
  input:{backgroundColor:'#111',borderWidth:1,borderColor:'#333',borderRadius:10,padding:14,color:'#fff',fontSize:16,fontFamily:'monospace'},
  multiInput:{minHeight:60,textAlignVertical:'top'},
  scanBtn:{backgroundColor:'#10b981',padding:14,borderRadius:10,alignItems:'center',marginTop:8},
  scanBtnText:{color:'#000',fontWeight:'700',fontSize:15},
  catalogStrip:{marginBottom:20},
  catalogItem:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:12,padding:10,marginRight:8,minWidth:120,alignItems:'center'},
  catalogItemActive:{borderColor:'#10b981',backgroundColor:'#10b98110'},
  catalogItemName:{color:'#ccc',fontSize:12,fontWeight:'600',marginBottom:2},
  catalogItemQty:{color:'#10b981',fontSize:11},
  productCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:16,padding:16,marginTop:12},
  productHeader:{flexDirection:'row',alignItems:'flex-start',marginBottom:16},
  productName:{color:'#fff',fontSize:16,fontWeight:'600',marginBottom:4},
  productMeta:{color:'#666',fontSize:12},
  qtyBadge:{backgroundColor:'#10b98110',borderWidth:2,borderColor:'#10b981',borderRadius:12,paddingHorizontal:12,paddingVertical:8,alignItems:'center'},
  qtyBadgeText:{color:'#10b981',fontSize:22,fontWeight:'800'},
  qtyBadgeUnit:{color:'#10b981',fontSize:10},
  qtyRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},
  qtyBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#222',alignItems:'center',justifyContent:'center'},
  qtyBtnText:{color:'#fff',fontSize:22,fontWeight:'600'},
  qtyInput:{backgroundColor:'#111',borderWidth:1,borderColor:'#333',borderRadius:10,padding:12,color:'#fff',fontSize:20,fontWeight:'700',width:80,textAlign:'center'},
  actionRow:{marginTop:16,gap:10},
  actionBtn:{padding:14,borderRadius:10,alignItems:'center'},
  actionBtnMain:{backgroundColor:'#10b981'},
  actionBtnAnomaly:{backgroundColor:'#ef444420',borderWidth:1,borderColor:'#ef444440'},
  actionBtnText:{color:'#000',fontSize:15,fontWeight:'700'},
  emptyState:{alignItems:'center',paddingVertical:60},
  emptyIcon:{fontSize:56,marginBottom:16},
  emptyText:{color:'#555',fontSize:14,textAlign:'center',lineHeight:22},
  emptyHint:{color:'#333',fontSize:11,marginTop:12},
  modalOverlay:{flex:1,backgroundColor:'#00000080',justifyContent:'flex-end'},
  modal:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20},
  modalTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8},
  modalDesc:{color:'#888',fontSize:13,marginBottom:4},
  anomalyNote:{color:'#f59e0b',fontSize:12,marginTop:12,textAlign:'center'},
  modalBtns:{flexDirection:'row',gap:12,marginTop:20},
  cancelBtn:{flex:1,padding:14,borderRadius:10,borderWidth:1,borderColor:'#333',alignItems:'center'},
  cancelBtnText:{color:'#aaa',fontSize:15},
  anomalySubmitBtn:{flex:1,padding:14,borderRadius:10,backgroundColor:'#ef4444',alignItems:'center'},
  anomalySubmitText:{color:'#fff',fontSize:15,fontWeight:'700'},
  resultOverlay:{flex:1,backgroundColor:'#00000080',alignItems:'center',justifyContent:'center'},
  resultCard:{backgroundColor:'#111',borderWidth:1,borderColor:'#222',borderRadius:20,padding:32,alignItems:'center',marginHorizontal:32},
  resultIcon:{fontSize:56,marginBottom:12},
  resultTitle:{fontSize:18,fontWeight:'700',color:'#fff',marginBottom:8,textAlign:'center'},
  resultProduct:{color:'#ccc',fontSize:14,marginBottom:4},
  resultQty:{fontSize:22,fontWeight:'800',color:'#10b981',marginVertical:8},
  resultStock:{color:'#666',fontSize:12,marginBottom:4},
  resultAnomalyNote:{color:'#f59e0b',fontSize:12,textAlign:'center',marginTop:4},
  resultPoints:{color:'#10b981',fontSize:12,marginTop:8},
  resultCloseBtn:{marginTop:20,paddingHorizontal:40,paddingVertical:12,backgroundColor:'#10b98120',borderRadius:10},
  resultCloseText:{color:'#10b981',fontSize:15,fontWeight:'600'},
});
