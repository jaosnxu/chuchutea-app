// CHUCHUTEA — Login Screen (with forgot password flow)
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const BACKEND = 'http://10.114.156.101:3000/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+790****0001');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<1|2>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!phone.trim() || !password.trim()) {
      setError('Введите телефон и пароль');
      return;
    }
    setLoading(true);
    const result = await login(phone.trim(), password);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  async function handleForgotStep1() {
    setForgotMsg('');
    if (!forgotPhone.trim()) { setForgotMsg('Введите телефон'); return; }
    setForgotLoading(true);
    try {
      const r = await fetch(`${BACKEND}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone.trim() }),
      });
      const d = await r.json();
      if (r.ok) { setForgotMsg('✅ Код отправлен (mock: ' + (d.mockCode || '123456') + ')'); setForgotStep(2); }
      else setForgotMsg('❌ ' + (d.error || 'Ошибка'));
    } catch { setForgotMsg('❌ Нет соединения'); }
    setForgotLoading(false);
  }

  async function handleForgotStep2() {
    setForgotMsg('');
    if (!forgotCode.trim()) { setForgotMsg('Введите код'); return; }
    if (!forgotNewPassword || forgotNewPassword.length < 6) { setForgotMsg('Пароль минимум 6 символов'); return; }
    setForgotLoading(true);
    try {
      const r = await fetch(`${BACKEND}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone.trim(), code: forgotCode.trim(), newPassword: forgotNewPassword }),
      });
      const d = await r.json();
      if (r.ok) {
        setForgotMsg('✅ Пароль изменён!');
        setTimeout(() => { setShowForgot(false); setForgotStep(1); setForgotMsg(''); }, 2000);
      } else setForgotMsg('❌ ' + (d.error || 'Ошибка'));
    } catch { setForgotMsg('❌ Нет соединения'); }
    setForgotLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🍵</Text>
        <Text style={styles.title}>CHUCHUTEA</Text>
        <Text style={styles.subtitle}>Вход в систему</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Телефон (+7...)"
          placeholderTextColor="#555"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotBtn} onPress={() => { setShowForgot(true); setForgotStep(1); setForgotMsg(''); }}>
          <Text style={styles.forgotText}>Забыли пароль?</Text>
        </TouchableOpacity>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={showForgot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🔑 Восстановление пароля</Text>

            {forgotStep === 1 ? (
              <>
                <Text style={styles.fieldLabel}>Телефон</Text>
                <TextInput style={styles.input} value={forgotPhone} onChangeText={setForgotPhone} placeholder="+79000000003" placeholderTextColor="#555" keyboardType="phone-pad" />
                {forgotMsg ? <Text style={{ color: forgotMsg.startsWith('✅') ? '#10b981' : '#ef4444', textAlign: 'center', marginTop: 8, fontSize: 13 }}>{forgotMsg}</Text> : null}
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForgot(false)}><Text style={styles.cancelText}>Отмена</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleForgotStep1} disabled={forgotLoading}>
                    {forgotLoading ? <ActivityIndicator color="#000"/> : <Text style={styles.submitText}>Получить код</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Код из SMS</Text>
                <TextInput style={styles.input} value={forgotCode} onChangeText={setForgotCode} placeholder="123456" placeholderTextColor="#555" keyboardType="numeric" />
                <Text style={styles.fieldLabel}>Новый пароль</Text>
                <TextInput style={styles.input} value={forgotNewPassword} onChangeText={setForgotNewPassword} placeholder="Минимум 6 символов" placeholderTextColor="#555" secureTextEntry />
                {forgotMsg ? <Text style={{ color: forgotMsg.startsWith('✅') ? '#10b981' : '#ef4444', textAlign: 'center', marginTop: 8, fontSize: 13 }}>{forgotMsg}</Text> : null}
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForgot(false)}><Text style={styles.cancelText}>Отмена</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleForgotStep2} disabled={forgotLoading}>
                    {forgotLoading ? <ActivityIndicator color="#000"/> : <Text style={styles.submitText}>Сменить пароль</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#10b981', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  error: { backgroundColor: '#450a0a', color: '#fca5a5', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 16, fontSize: 13 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 16, fontSize: 16, color: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  forgotBtn: { marginTop: 16, alignItems: 'center' },
  forgotText: { color: '#10b981', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16, textAlign: 'center' },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 8 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelText: { color: '#aaa', fontSize: 15 },
  submitBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  submitText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
