/**
 * Demo screen — test the PomPomJar animation.
 * Navigate to /pompom-demo to try it out.
 * This file can be deleted before shipping.
 */
import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity,
  TextInput, StyleSheet, Platform,
} from 'react-native';
import { PomPomJar } from '@/components/PomPomJarAnimated';
import { Colors } from '@/components/ui';

const GOAL = 100;
const ptr  = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

export default function PomPomDemoScreen() {
  const [current,   setCurrent]   = useState(0);
  const [inputText, setInputText] = useState('');

  function bump(n: number) {
    setCurrent(prev => Math.min(Math.max(prev + n, 0), GOAL));
  }

  function applyInput() {
    const n = parseInt(inputText, 10);
    if (!isNaN(n)) setCurrent(Math.min(Math.max(n, 0), GOAL));
    setInputText('');
  }

  return (
    <SafeAreaView style={S.screen}>

      <Text style={S.heading}>🫙 בדיקת צנצנת פונפונים</Text>

      <PomPomJar current={current} goal={GOAL} />

      {/* ± quick buttons */}
      <View style={S.btnRow}>
        {([-10, -5, -1, +1, +5, +10] as const).map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => bump(n)}
            style={[S.btn, n > 0 ? S.btnPos : S.btnNeg, ptr]}
            accessibilityRole="button"
            accessibilityLabel={`${n > 0 ? '+' : ''}${n} נקודות`}
          >
            <Text style={[S.btnTxt, n > 0 ? S.btnPosTxt : S.btnNegTxt]}>
              {n > 0 ? `+${n}` : `${n}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Manual value input */}
      <View style={S.inputRow}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={applyInput}
          placeholder="0 – 100"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          returnKeyType="go"
          style={S.input}
          accessibilityLabel="הכנס ערך ישירות"
        />
        <TouchableOpacity onPress={applyInput} style={[S.setBtn, ptr]}>
          <Text style={S.setBtnTxt}>הגדר</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrent(0)} style={[S.resetBtn, ptr]}>
          <Text style={S.resetTxt}>איפוס</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  heading: {
    fontSize: 20, fontWeight: '700', color: '#1e293b',
    marginBottom: 32, fontFamily: 'Baloo2_700Bold',
  } as any,

  // ± buttons
  btnRow:   { flexDirection: 'row', gap: 8, marginTop: 28 },
  btn:      { width: 50, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnPos:   { backgroundColor: '#EEF2FF', borderColor: '#818cf8' },
  btnNeg:   { backgroundColor: '#FEF2F2', borderColor: '#fca5a5' },
  btnTxt:   { fontWeight: '700', fontSize: 14 } as any,
  btnPosTxt:{ color: '#4338ca' },
  btnNegTxt:{ color: '#dc2626' },

  // Manual input row
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  input: {
    width: 90, height: 42,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 10, fontSize: 15,
    backgroundColor: '#fff', textAlign: 'center', color: '#1e293b',
  } as any,
  setBtn:   { height: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  setBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 } as any,
  resetBtn: { height: 42, justifyContent: 'center', paddingHorizontal: 8 },
  resetTxt: { color: '#94a3b8', fontSize: 13 } as any,
});
