// CHUCHUTEA — Barcode Scanner (mock, no native camera)
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ visible, onClose, onScan }: Props) {
  const [manualCode, setManualCode] = useState('');

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={s.container}>
        <Text style={s.title}>Сканер штрихкодов</Text>
        <Text style={s.hint}>Введите штрихкод вручную</Text>
        <TextInput
          style={s.input}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="4601234567890"
          placeholderTextColor="#555"
          keyboardType="numeric"
          autoFocus
        />
        <TouchableOpacity style={s.scanBtn} onPress={() => { if (manualCode.trim()) { onScan(manualCode.trim()); setManualCode(''); } }}>
          <Text style={s.scanBtnText}>Найти</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.closeBtn} onPress={() => { setManualCode(''); onClose(); }}>
          <Text style={s.closeBtnText}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  hint: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16, color: '#fff', fontSize: 20, textAlign: 'center', letterSpacing: 3 },
  scanBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  scanBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  closeBtn: { marginTop: 16, padding: 12, alignItems: 'center' },
  closeBtnText: { color: '#888', fontSize: 15 },
});
