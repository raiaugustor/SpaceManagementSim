import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { useMission } from '../context/MissionContext';

const { width: SW } = Dimensions.get('window');

const C = {
  g: '#00ff88', a: '#ffb300', r: '#ff3b3b', b: '#00c8ff',
  bg: '#020c14', panel: 'rgba(4,14,24,0.92)', border: 'rgba(0,200,255,0.22)',
  muted: 'rgba(200,232,255,0.4)', text: '#e0f4ff',
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function pColor(pct: number) {
  if (pct <= 20) return C.r;
  if (pct <= 50) return C.a;
  return C.g;
}

function Row({ label, value, vc = C.text }: { label: string; value: string; vc?: string }) {
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={[s.val, { color: vc }]}>{value}</Text>
    </View>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function Panel({ label, children, style }: {
  label: string; children: React.ReactNode; style?: object;
}) {
  return (
    <View style={[s.panel, style]}>
      <View style={s.panelLabel}><Text style={s.panelLabelTxt}>{label}</Text></View>
      {children}
    </View>
  );
}

function StatBox({ value, label, color = C.b }: { value: string; label: string; color?: string }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statNum, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function Gauge({
  value, unit, label, sublabel, color, dashOffset,
}: {
  value: string; unit?: string; label: string; sublabel: string;
  color: string; dashOffset: number;
}) {
  return (
    <View style={s.gaugeWrap}>
      <Svg width={70} height={70} viewBox="0 0 70 70">
        <Circle cx={35} cy={35} r={28} fill="none" stroke="rgba(0,200,255,0.1)" strokeWidth={6} />
        <Circle
          cx={35} cy={35} r={28}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="176 176"
          strokeDashoffset={`${dashOffset}`}
          transform="rotate(-90 35 35)"
        />
        <SvgText x={35} y={32} textAnchor="middle" fontFamily="Orbitron-Bold" fontSize={10} fill={color}>
          {value}
        </SvgText>
        <SvgText x={35} y={45} textAnchor="middle" fontFamily="ShareTechMono" fontSize={7} fill={C.muted}>
          {sublabel}
        </SvgText>
      </Svg>
      <Text style={s.gaugeLbl}>{label}</Text>
    </View>
  );
}

// ─── Mini gráfico de linha SVG ────────────────────────────────────────────────

type ChartKey = 'fuel' | 'batt' | 'temp' | 'press';

const CHART_CONFIG: Record<ChartKey, { label: string; color: string; base: number; amp: number; min: number; max: number }> = {
  fuel:  { label: 'Combustível (%)',       color: C.r, base: 20,   amp: 2,    min: 15,   max: 30 },
  batt:  { label: 'Bateria (%)',           color: C.g, base: 87,   amp: 3,    min: 80,   max: 95 },
  temp:  { label: 'Temp. interna (°C)',    color: C.b, base: 22,   amp: 1.5,  min: 18,   max: 26 },
  press: { label: 'Pressão cabine (atm)',  color: C.a, base: 1.02, amp: 0.03, min: 0.95, max: 1.08 },
};

function genData(base: number, amp: number, min: number, max: number): number[] {
  return Array.from({ length: 25 }, (_, i) =>
    Math.min(max, Math.max(min,
      base + Math.sin(i * 0.4) * amp + (Math.random() - 0.5) * amp * 0.5
    ))
  );
}

function MiniChart({ chartKey }: { chartKey: ChartKey }) {
  const cfg = CHART_CONFIG[chartKey];
  const data = useRef(genData(cfg.base, cfg.amp, cfg.min, cfg.max)).current;
  const W = SW - 48, H = 72, pts = data.length;
  const dMin = Math.min(...data), dMax = Math.max(...data);
  const range = dMax - dMin || 1;

  let pathD = '';
  let fillD = '';
  data.forEach((v, i) => {
    const x = (i / (pts - 1)) * W;
    const y = H - ((v - dMin) / range) * (H - 8) - 4;
    pathD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    if (i === 0) fillD = `M${x.toFixed(1)} ${H} L${x.toFixed(1)} ${y.toFixed(1)}`;
    else fillD += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  fillD += ` L${W} ${H} Z`;

  const hex = cfg.color;
  const fillColor = hex === C.r ? 'rgba(255,59,59,0.08)'
    : hex === C.g ? 'rgba(0,255,136,0.07)'
    : hex === C.b ? 'rgba(0,200,255,0.07)'
    : 'rgba(255,179,0,0.07)';

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Path d={fillD} fill={fillColor} />
      <Path d={pathD} fill="none" stroke={cfg.color} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function TelemetryScreen() {
  const router = useRouter();
  const { mission } = useMission();
  const [activeChart, setActiveChart] = useState<ChartKey>('fuel');

  // Valores animados locais (oscilam levemente como no design)
  const [fuel,   setFuel]   = useState(mission.fuelPercent);
  const [batt,   setBatt]   = useState(mission.batteryPercent);
  const [tempIn, setTempIn] = useState(mission.tempInternal);
  const [tempEx, setTempEx] = useState(mission.tempExternal);

  useEffect(() => {
    const id = setInterval(() => {
      setFuel(v  => parseFloat(Math.max(15, Math.min(22, v  + (Math.random() - 0.52) * 0.08)).toFixed(1)));
      setBatt(v  => parseFloat(Math.max(84, Math.min(91, v  + (Math.random() - 0.48) * 0.12)).toFixed(1)));
      setTempIn(v => parseFloat(Math.max(20, Math.min(24, v  + (Math.random() - 0.5)  * 0.05)).toFixed(1)));
      setTempEx(v => parseFloat(Math.max(-195, Math.min(-180, v + (Math.random() - 0.5) * 0.15)).toFixed(1)));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const autonomia = Math.round(fuel / 0.47);
  const tempInStr = (tempIn >= 0 ? '+' : '') + tempIn.toFixed(1) + '°C';
  const tempExStr = tempEx.toFixed(0) + '°C';

  const CHART_BTNS: { key: ChartKey; label: string }[] = [
    { key: 'fuel',  label: 'Combustível' },
    { key: 'batt',  label: 'Bateria' },
    { key: 'temp',  label: 'Temperatura' },
    { key: 'press', label: 'Pressão' },
  ];

  return (
    <View style={s.root}>
      <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
      <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backTxt}>← DASHBOARD</Text>
          </TouchableOpacity>
          <Text style={s.title}>TELEMETRIA DA NAVE</Text>
          <View style={s.badge}><Text style={s.badgeTxt}>NOMINAL</Text></View>
        </View>

        {/* Stat cards */}
        <View style={s.statRow}>
          <StatBox value={fuel.toFixed(0) + '%'} label="Combustível" color={C.r} />
          <StatBox value={batt.toFixed(0) + '%'} label="Bateria"     color={C.g} />
          <StatBox value={tempInStr}              label="Temp. interna" color={C.g} />
          <StatBox value={tempExStr}              label="Temp. externa" color={C.r} />
        </View>

        {/* Energia e propulsão */}
        <Panel label="ENERGIA E PROPULSÃO">
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <Row label="Combustível principal" value={fuel.toFixed(1) + '%'} vc={C.r} />
              <Bar pct={fuel} color={C.r} />
              <Row label="Reserva RCS"   value="34%" vc={C.a} />
              <Bar pct={34} color={C.a} />
              <Row label="Consumo atual"      value="0.12 kg/s" />
              <Row label="Autonomia restante" value={`~${autonomia} dias`} vc={C.a} />
            </View>
            <View style={[{ flex: 1 }, s.colGap]}>
              <Row label="Bateria principal" value={batt.toFixed(1) + '%'} vc={C.g} />
              <Bar pct={batt} color={C.g} />
              <Row label="Painel solar A" value="4.2 kW" vc={C.g} />
              <Bar pct={84} color={C.g} />
              <Row label="Painel solar B" value="3.9 kW" vc={C.g} />
              <Bar pct={78} color={C.g} />
              <Row label="Carga total" value="8.1 kW" />
            </View>
          </View>
        </Panel>

        {/* Sistema térmico */}
        <Panel label="SISTEMA TÉRMICO">
          <View style={s.threeCol}>
            <Gauge
              value={(tempIn >= 0 ? '+' : '') + tempIn.toFixed(0) + '°C'}
              label="Cabine" sublabel="INTERNA"
              color={C.g} dashOffset={70}
            />
            <Gauge
              value={tempEx.toFixed(0) + '°C'}
              label="Casco" sublabel="EXTERNA"
              color={C.r} dashOffset={14}
            />
            <Gauge
              value="+18°C"
              label="Compartimento" sublabel="MOTOR"
              color={C.g} dashOffset={88}
            />
          </View>
          <View style={[s.twoCol, { marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <Row label="Radiador primário"    value="ATIVO"    vc={C.g} />
              <Row label="Radiador secundário"  value="STANDBY"  vc={C.g} />
              <Row label="Fluido resfriamento"  value="92%" />
            </View>
            <View style={[{ flex: 1 }, s.colGap]}>
              <Row label="Isolamento térmico" value="DEGRADADO" vc={C.r} />
              <Row label="Aquecedores cabine" value="ATIVO"     vc={C.g} />
              <Row label="Delta T casco"      value="-209°C"    vc={C.r} />
            </View>
          </View>
        </Panel>

        {/* Pressurização e suporte de vida */}
        <Panel label="PRESSURIZAÇÃO E SUPORTE DE VIDA">
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <Row label="Pressão cabine" value="1.02 atm" vc={C.g} />
              <Bar pct={51} color={C.g} />
              <Row label="Oxigênio (O₂)" value="94%" vc={C.g} />
              <Bar pct={94} color={C.g} />
              <Row label="CO₂ atual"     value="0.4%" vc={C.g} />
              <Bar pct={8}  color={C.g} />
            </View>
            <View style={[{ flex: 1 }, s.colGap]}>
              <Row label="Umidade relativa"   value="48%"     vc={C.g} />
              <Bar pct={48} color={C.g} />
              <Row label="Água potável"       value="76%"     vc={C.g} />
              <Bar pct={76} color={C.g} />
              <Row label="Radiação acumulada" value="312 mSv" vc={C.a} />
              <Bar pct={62} color={C.a} />
            </View>
          </View>
        </Panel>

        {/* Histórico */}
        <Panel label="HISTÓRICO — ÚLTIMAS 24H">
          <View style={s.chartBtns}>
            {CHART_BTNS.map(b => (
              <TouchableOpacity
                key={b.key}
                onPress={() => setActiveChart(b.key)}
                style={[s.chartBtn, activeChart === b.key && s.chartBtnActive]}
              >
                <Text style={[s.chartBtnTxt, activeChart === b.key && { color: C.b }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginVertical: 4 }}>
            <MiniChart key={activeChart} chartKey={activeChart} />
          </View>
          <View style={s.chartXLabels}>
            {['-24h', '-18h', '-12h', '-6h', 'AGORA'].map(l => (
              <Text key={l} style={s.chartXLbl}>{l}</Text>
            ))}
          </View>
        </Panel>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 12, paddingBottom: 40 },

  corner: { position: 'absolute', width: 14, height: 14, zIndex: 10 },
  cTL: { top: 6, left: 6,   borderTopWidth: 1,    borderLeftWidth: 1,  borderColor: 'rgba(0,200,255,0.4)' },
  cTR: { top: 6, right: 6,  borderTopWidth: 1,    borderRightWidth: 1, borderColor: 'rgba(0,200,255,0.4)' },
  cBL: { bottom: 6, left: 6,  borderBottomWidth: 1, borderLeftWidth: 1,  borderColor: 'rgba(0,200,255,0.4)' },
  cBR: { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(0,200,255,0.4)' },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,255,0.2)', paddingBottom: 8, marginBottom: 10, gap: 8 },
  backBtn:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,200,255,0.3)', backgroundColor: 'rgba(0,200,255,0.07)' },
  backTxt:  { fontFamily: 'ShareTechMono', fontSize: 10, color: C.b, letterSpacing: 1 },
  title:    { fontFamily: 'Orbitron-Bold', fontSize: 11, color: C.b, letterSpacing: 2, flex: 1, textAlign: 'center' },
  badge:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, borderWidth: 1, borderColor: C.g, backgroundColor: 'rgba(0,255,136,0.1)' },
  badgeTxt: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.g, letterSpacing: 2 },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(0,200,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.12)', borderRadius: 3, padding: 7, alignItems: 'center' },
  statNum: { fontFamily: 'Orbitron-Bold', fontSize: 15, color: C.b },
  statLbl: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' },

  panel:        { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8, position: 'relative' },
  panelLabel:   { position: 'absolute', top: -1, left: 10, backgroundColor: C.bg, paddingHorizontal: 4 },
  panelLabelTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.b, letterSpacing: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  lbl: { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontFamily: 'ShareTechMono', fontSize: 12, color: C.text },

  barTrack: { height: 5, backgroundColor: 'rgba(0,200,255,0.08)', borderRadius: 2, marginTop: 2, marginBottom: 8, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },

  twoCol:  { flexDirection: 'row', gap: 8 },
  threeCol:{ flexDirection: 'row', gap: 8, justifyContent: 'space-around', marginBottom: 8 },
  colGap:  { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(0,200,255,0.08)' },

  gaugeWrap: { alignItems: 'center', gap: 4 },
  gaugeLbl:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  chartBtns:    { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  chartBtn:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,200,255,0.25)' },
  chartBtnActive:{ borderColor: C.b, backgroundColor: 'rgba(0,200,255,0.07)' },
  chartBtnTxt:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, letterSpacing: 1 },

  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartXLbl:    { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted },
});