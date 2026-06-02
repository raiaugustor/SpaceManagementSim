import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import { useMission } from '../context/MissionContext';

const { width: SW } = Dimensions.get('window');

const Colors = {
  hudGreen:    '#00ff88',
  hudAmber:    '#ffb300',
  hudRed:      '#ff3b3b',
  hudBlue:     '#00c8ff',
  panelBg:     'rgba(4, 14, 24, 0.92)',
  borderGlow:  'rgba(0, 200, 255, 0.25)',
  background:  '#020c14',
  textPrimary: '#c8e8ff',
  textMuted:   'rgba(200, 232, 255, 0.45)',
  textDimmer:  'rgba(200, 232, 255, 0.35)',
};

const Fonts = {
  mono:         'ShareTechMono',
  orbitronSemi: 'Orbitron-SemiBold',
  orbitronBold: 'Orbitron-Bold',
};

function percentColor(pct: number): string {
  if (pct <= 20) return '#ff3b3b';
  if (pct <= 50) return '#ffb300';
  return '#00ff88';
}

function formatMET(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d}:${pad(h)}:${pad(m)}`;
}

function formatUTC(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function orbitPoint(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function PanelRow({ label, value, valueColor = Colors.textPrimary, big = false, unit }: {
  label: string; value: string; valueColor?: string; big?: boolean; unit?: string;
}) {
  return (
    <View style={s.panelRow}>
      <Text style={s.panelLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={[big ? s.panelValueBig : s.panelValue, { color: valueColor }]}>{value}</Text>
        {unit ? <Text style={s.unitLabel}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function BarTrack({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.min(100, Math.max(0, pct))}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SysItem({ label, status }: { label: string; status: 'ok' | 'warn' | 'crit' }) {
  const color = status === 'ok' ? '#00ff88' : status === 'warn' ? '#ffb300' : '#ff3b3b';
  return (
    <View style={s.sysItem}>
      <View style={[s.sysDot, { backgroundColor: color }]} />
      <Text style={s.sysName}>{label}</Text>
    </View>
  );
}

function HudPanel({ label, children, style }: {
  label: string; children: React.ReactNode; style?: object;
}) {
  return (
    <View style={[s.hudPanel, style]}>
      <View style={s.panelLabelWrap}>
        <Text style={s.panelLabelTag}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function OrbitRadar({ angle }: { angle: number }) {
  const CX = 60, CY = 60, R = 38;
  const ship = orbitPoint(CX, CY, R, angle);
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Circle cx={CX} cy={CY} r={55} fill="none" stroke="rgba(0,200,255,0.08)" strokeWidth={1} />
      <Circle cx={CX} cy={CY} r={38} fill="none" stroke="rgba(0,200,255,0.12)" strokeWidth={0.5} />
      <Circle cx={CX} cy={CY} r={20} fill="none" stroke="rgba(0,200,255,0.2)" strokeWidth={0.5} />
      <Line x1={CX} y1={5} x2={CX} y2={115} stroke="rgba(0,200,255,0.08)" strokeWidth={0.5} />
      <Line x1={5} y1={CY} x2={115} y2={CY} stroke="rgba(0,200,255,0.08)" strokeWidth={0.5} />
      <Circle cx={CX} cy={CY} r={7} fill="#c1440e" opacity={0.9} />
      <Ellipse cx={CX} cy={CY} rx={R} ry={R} fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth={0.5} strokeDasharray="3 4" />
      <Line x1={CX} y1={CY} x2={ship.x} y2={ship.y} stroke="rgba(0,255,136,0.25)" strokeWidth={1} />
      <Circle cx={ship.x} cy={ship.y} r={4} fill="#00c8ff" />
      <Circle cx={ship.x} cy={ship.y} r={6} fill="none" stroke="#00c8ff" strokeWidth={0.5} opacity={0.5} />
    </Svg>
  );
}

function SignalBars({ active }: { active: number }) {
  const heights = [8, 12, 16, 20, 24, 28, 32];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginVertical: 6 }}>
      {heights.map((h, i) => (
        <View key={i} style={[s.sigBar, { height: h, backgroundColor: i < active ? '#00c8ff' : 'rgba(0,200,255,0.15)' }]} />
      ))}
    </View>
  );
}

function AlertModal({ visible, alerts, onClose, onDismiss }: {
  visible: boolean; alerts: string[]; onClose: () => void; onDismiss: (i: number) => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={s.alertOverlay}>
        <View style={s.alertBox}>
          <View style={s.alertHeader}>
            <Text style={s.alertTitle}>⚠ ALERTAS DO SISTEMA</Text>
            <TouchableOpacity onPress={onClose} style={s.alertCloseBtn}>
              <Text style={s.alertCloseTxt}>FECHAR</Text>
            </TouchableOpacity>
          </View>
          {alerts.length === 0
            ? <Text style={[s.alertText, { color: '#00ff88' }]}>Nenhum alerta ativo.</Text>
            : alerts.map((a, i) => (
              <TouchableOpacity key={i} onPress={() => onDismiss(i)} style={s.alertItem}>
                <View style={[s.alertDot, { backgroundColor: i === 2 ? '#ffb300' : '#ff3b3b' }]} />
                <Text style={s.alertText}>{a}</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      </View>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { mission, dismissAlert } = useMission();
  const [utc, setUtc] = useState(formatUTC());
  const [alertVisible, setAlertVisible] = useState(true);
  const pulsAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsAnim, { toValue: 1,   duration: 1000, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(pulsAnim, { toValue: 0.4, duration: 1000, easing: Easing.ease, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setUtc(formatUTC()), 1000);
    return () => clearInterval(id);
  }, []);

  const borderColor = pulsAnim.interpolate({
    inputRange:  [0.4, 1],
    outputRange: ['rgba(0,255,136,0.4)', 'rgba(0,255,136,1)'],
  });

  return (
    <View style={s.root}>
      <View style={[s.corner, s.cornerTL]} />
      <View style={[s.corner, s.cornerTR]} />
      <View style={[s.corner, s.cornerBL]} />
      <View style={[s.corner, s.cornerBR]} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={s.missionName} numberOfLines={1}>{mission.missionName}</Text>
          <Animated.View style={[s.statusBadge, { borderColor }]}>
            <Text style={s.statusBadgeTxt}>{mission.status}</Text>
          </Animated.View>
        </View>

        {/* Relógio */}
        <View style={s.clockRow}>
          <Text style={s.clockText}>
            {'MET '}<Text style={{ color: '#00c8ff' }}>{formatMET(mission.metSeconds)}</Text>
            {'  |  UTC '}<Text style={{ color: '#00c8ff' }}>{utc}</Text>
          </Text>
          {mission.alerts.length > 0 && (
            <TouchableOpacity onPress={() => setAlertVisible(true)} style={s.alertBadge}>
              <Text style={s.alertBadgeTxt}>⚠ {mission.alerts.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Painel 1 — Missão geral */}
        <HudPanel label="MISSÃO GERAL" style={s.panelFull}>
          <PanelRow label="Destino"        value={mission.destination}  valueColor="#00ff88" />
          <PanelRow label="Status"         value="NOMINAL"              valueColor="#00ff88" />
          <PanelRow label="Dist. da Terra" value={mission.distanceFromEarth.toString()} unit=" M km" big />
          <PanelRow label="Velocidade"     value={mission.velocityKms.toString()}       unit=" km/s" />
          <PanelRow label="Tempo de missão" value={`${Math.floor(mission.metSeconds / 86400)} dias`} />
        </HudPanel>

        {/* Painel 2 — Telemetria */}
        <HudPanel label="TELEMETRIA DA NAVE" style={s.panelFull}>
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <PanelRow label="Combustível" value={`${mission.fuelPercent}%`}    valueColor={percentColor(mission.fuelPercent)} />
              <BarTrack pct={mission.fuelPercent}    color={percentColor(mission.fuelPercent)} />
              <PanelRow label="Bateria"     value={`${mission.batteryPercent}%`} valueColor={percentColor(mission.batteryPercent)} />
              <BarTrack pct={mission.batteryPercent} color={percentColor(mission.batteryPercent)} />
              <PanelRow label="Sinal"       value={`${mission.signalPercent}%`}  valueColor={percentColor(mission.signalPercent)} />
              <BarTrack pct={mission.signalPercent}  color={percentColor(mission.signalPercent)} />
            </View>
            <View style={[{ flex: 1 }, s.colGap]}>
              <PanelRow label="Temp. interna"  value={`+${mission.tempInternal}°C`}   valueColor="#00ff88" />
              <BarTrack pct={55} color="#00ff88" />
              <PanelRow label="Temp. externa"  value={`${mission.tempExternal}°C`}    valueColor="#ff3b3b" />
              <BarTrack pct={95} color="#ff3b3b" />
              <PanelRow label="Pressão cabine" value={`${mission.cabinPressure} atm`} valueColor="#00ff88" />
              <BarTrack pct={51} color="#00ff88" />
            </View>
          </View>
        </HudPanel>

        {/* Painel 3 — Comunicação */}
        <HudPanel label="COMUNICAÇÃO" style={s.panelFull}>
          <PanelRow label="Latência"    value={`${mission.latencyMin} min`} valueColor="#ffb300" />
          <PanelRow label="Intensidade" value={`${mission.signalDbm} dBm`}  valueColor="#ffb300" />
          <SignalBars active={mission.signalBars} />
          <PanelRow label="Protocolo"   value="DSN X-BAND" />
          <PanelRow label="Uplink"      value={mission.uplinkActive ? 'ATIVO' : 'INATIVO'} valueColor={mission.uplinkActive ? '#00ff88' : '#ff3b3b'} />
        </HudPanel>

        {/* Painel 4 — Sistemas */}
        <HudPanel label="SAÚDE DOS SISTEMAS" style={s.panelFull}>
          <View style={s.sysGrid}>
            <SysItem label="Propulsão"   status={mission.systems.propulsion} />
            <SysItem label="Energia"     status={mission.systems.power} />
            <SysItem label="Comunicação" status={mission.systems.comms} />
            <SysItem label="Navegação"   status={mission.systems.navigation} />
            <SysItem label="Térmico"     status={mission.systems.thermal} />
            <SysItem label="Estrutural"  status={mission.systems.structural} />
          </View>
          <View style={s.sysLegend}>
            <Text style={s.legendItem}><Text style={{ color: '#00ff88' }}>● </Text>Normal</Text>
            <Text style={s.legendItem}><Text style={{ color: '#ffb300' }}>● </Text>Atenção</Text>
            <Text style={s.legendItem}><Text style={{ color: '#ff3b3b' }}>● </Text>Crítico</Text>
          </View>
        </HudPanel>

        {/* Painel 5 — Órbita */}
        <HudPanel label="ESTABILIDADE ORBITAL" style={s.panelFull}>
          <View style={s.orbitRow}>
            <OrbitRadar angle={mission.shipAngle} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <PanelRow label="Inclinação" value={`${mission.orbitInclination}°`} />
                  <PanelRow label="Altitude"   value={`${mission.orbitAltitudeKm} km`} valueColor="#00ff88" />
                  <PanelRow label="Período"    value={`${mission.orbitPeriodMin} min`} />
                </View>
                <View style={[{ flex: 1 }, s.colGap]}>
                  <PanelRow label="Excentric."  value={mission.orbitEccentricity.toString()} valueColor="#00ff88" />
                  <PanelRow label="Δv"          value={`${mission.deltaVAvailable} m/s`}     valueColor="#ffb300" />
                  <PanelRow label="Estabilidade" value={mission.orbitStable ? 'ESTÁVEL' : 'INSTÁVEL'} valueColor={mission.orbitStable ? '#00ff88' : '#ff3b3b'} />
                </View>
              </View>
            </View>
          </View>
        </HudPanel>

      </ScrollView>

      <AlertModal
        visible={alertVisible}
        alerts={mission.alerts}
        onClose={() => setAlertVisible(false)}
        onDismiss={(i) => {
          dismissAlert(i);
          if (mission.alerts.length <= 1) setAlertVisible(false);
        }}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#020c14' },
  scroll: { padding: 12, paddingBottom: 40 },

  corner:    { position: 'absolute', width: 14, height: 14, zIndex: 10 },
  cornerTL:  { top: 6,    left: 6,  borderTopWidth: 1,    borderLeftWidth: 1,  borderColor: 'rgba(0,200,255,0.4)' },
  cornerTR:  { top: 6,    right: 6, borderTopWidth: 1,    borderRightWidth: 1, borderColor: 'rgba(0,200,255,0.4)' },
  cornerBL:  { bottom: 6, left: 6,  borderBottomWidth: 1, borderLeftWidth: 1,  borderColor: 'rgba(0,200,255,0.4)' },
  cornerBR:  { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(0,200,255,0.4)' },

  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,255,0.2)', paddingBottom: 8, marginBottom: 6, gap: 8 },
  missionName:   { fontFamily: 'Orbitron-Bold', fontSize: 11, color: '#00c8ff', letterSpacing: 2, flex: 1 },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, borderWidth: 1, backgroundColor: 'rgba(0,255,136,0.1)' },
  statusBadgeTxt:{ fontFamily: 'ShareTechMono', fontSize: 10, color: '#00ff88', letterSpacing: 2 },

  clockRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clockText:    { fontFamily: 'ShareTechMono', fontSize: 10, color: 'rgba(200,232,255,0.5)' },
  alertBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, borderWidth: 1, borderColor: '#ff3b3b', backgroundColor: 'rgba(255,59,59,0.1)' },
  alertBadgeTxt:{ fontFamily: 'ShareTechMono', fontSize: 10, color: '#ff3b3b' },

  hudPanel:      { backgroundColor: 'rgba(4,14,24,0.92)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.25)', borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8 },
  panelFull:     { width: '100%' },
  panelLabelWrap:{ position: 'absolute', top: -1, left: 10, backgroundColor: '#020c14', paddingHorizontal: 4 },
  panelLabelTag: { fontFamily: 'ShareTechMono', fontSize: 9, color: '#00c8ff', letterSpacing: 2 },

  panelRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  panelLabel:   { fontFamily: 'ShareTechMono', fontSize: 10, color: 'rgba(200,232,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
  panelValue:   { fontFamily: 'ShareTechMono', fontSize: 12, color: '#c8e8ff' },
  panelValueBig:{ fontFamily: 'Orbitron-SemiBold', fontSize: 18, color: '#00c8ff' },
  unitLabel:    { fontFamily: 'ShareTechMono', fontSize: 9, color: 'rgba(200,232,255,0.35)', marginLeft: 2 },

  barTrack: { height: 5, backgroundColor: 'rgba(0,200,255,0.1)', borderRadius: 2, marginTop: 3, marginBottom: 6, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },

  twoCol:  { flexDirection: 'row', gap: 8 },
  colGap:  { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(0,200,255,0.08)' },

  sysGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sysItem:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.02)', width: (SW - 24 - 32) / 2 },
  sysDot:   { width: 8, height: 8, borderRadius: 4 },
  sysName:  { fontFamily: 'ShareTechMono', fontSize: 10, color: 'rgba(200,232,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  sysLegend:{ flexDirection: 'row', gap: 12, marginTop: 8 },
  legendItem:{ fontFamily: 'ShareTechMono', fontSize: 9, color: 'rgba(200,232,255,0.35)' },

  sigBar: { width: 8, borderRadius: 1 },

  orbitRow: { flexDirection: 'row', alignItems: 'center' },

  alertOverlay: { flex: 1, backgroundColor: 'rgba(2,12,20,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox:     { backgroundColor: 'rgba(4,14,24,0.97)', borderWidth: 1, borderColor: '#ff3b3b', borderRadius: 4, padding: 16, width: '100%', maxWidth: 360 },
  alertHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertTitle:   { fontFamily: 'Orbitron-SemiBold', fontSize: 11, color: '#ff3b3b', letterSpacing: 2 },
  alertCloseBtn:{ borderWidth: 1, borderColor: 'rgba(255,59,59,0.4)', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3 },
  alertCloseTxt:{ fontFamily: 'ShareTechMono', fontSize: 10, color: '#ff3b3b', letterSpacing: 1 },
  alertItem:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  alertDot:     { width: 6, height: 6, borderRadius: 3 },
  alertText:    { fontFamily: 'ShareTechMono', fontSize: 11, color: 'rgba(200,232,255,0.8)', flex: 1 },
});