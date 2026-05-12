// CHUCHUTEA — Camera Barcode Scanner using react-native-vision-camera v5
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ visible, onClose, onScan }: Props) {
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'code-128', 'code-39', 'qr', 'upc-e'],
    onCodeScanned: useCallback((codes) => {
      const value = codes[0]?.value;
      if (value && value !== lastScanned) {
        setLastScanned(value);
        onScan(value);
      }
    }, [lastScanned, onScan]),
  });

  // Request permission on mount
  const requestPermission = useCallback(async () => {
    try {
      const status = await Camera.requestCameraPermission();
      if (status === 'granted') {
        setHasPermission(true);
        setError('');
      } else {
        setError('Нет доступа к камере. Разрешите в настройках.');
      }
    } catch (e) {
      setError('Ошибка доступа к камере');
    }
  }, []);

  return (
    <Modal visible={visible} animationType="slide" onShow={requestPermission}>
      <View style={s.container}>
        {!hasPermission && !error && (
          <View style={s.centered}>
            <ActivityIndicator color="#10b981" size="large" />
            <Text style={s.hint}>Запрос доступа к камере...</Text>
          </View>
        )}

        {error !== '' && (
          <View style={s.centered}>
            <Text style={s.errorIcon}>📵</Text>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
              <Text style={s.permissionBtnText}>Разрешить доступ</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission && device && (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            codeScanner={codeScanner}
          />
        )}

        {hasPermission && !device && (
          <View style={s.centered}>
            <Text style={s.errorIcon}>📷</Text>
            <Text style={s.errorText}>Камера не найдена</Text>
          </View>
        )}

        {/* Scan overlay */}
        {hasPermission && device && (
          <View style={s.overlay}>
            <View style={s.scanFrame}>
              <Text style={s.scanHint}>Наведите на штрихкод</Text>
              <View style={s.lastScannedRow}>
                {lastScanned !== '' && <Text style={s.lastScanned}>Считано: {lastScanned}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Header bar */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => { setLastScanned(''); onClose(); }}>
            <Text style={s.closeText}>✕ Закрыть</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom bar */}
        <View style={s.bottomBar}>
          <Text style={s.bottomTitle}>📷 Сканер штрихкодов</Text>
          <Text style={s.bottomHint}>Поддерживаются EAN-13, EAN-8, Code-128, QR</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  hint: { color: '#888', fontSize: 14 },
  errorIcon: { fontSize: 56 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  permissionBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#10b981', borderRadius: 10 },
  permissionBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 260, height: 180,
    borderWidth: 2, borderColor: '#10b981', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#10b98180', fontSize: 12, position: 'absolute', top: -24 },
  lastScannedRow: { position: 'absolute', bottom: -36 },
  lastScanned: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  header: { position: 'absolute', top: 50, right: 16, zIndex: 10 },
  closeBtn: { backgroundColor: '#00000080', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 48, left: 20, right: 20,
    backgroundColor: '#00000060', borderRadius: 16, padding: 16, alignItems: 'center',
  },
  bottomTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottomHint: { color: '#888', fontSize: 11, marginTop: 4 },
});
