import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, {
    Circle, Ellipse, Line, Path,
    Text as SvgText,
} from 'react-native-svg';
import { useMission } from '../context/MissionContext';

const { width: SW } = Dimensions.get('window');

const C = {
  g: '#00ff88', a: '#ffb300', r: '#ff3b3b', b: '#00c8ff',
  bg: '#020c14', panel: 'rgba(4,14,24,0.92)', border: 'rgba(0,200,255,0.22)',
  muted: 'rgba(200,232,255,0.4)', text: '#e0f4ff',
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function Row({ label, value, vc = C.text }: { label: string; value: string; vc?: string }) {
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={[s.val, { color: vc }]}>{value}</Text>
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

function Divider() {
  return <View style={s.divider} />;
}

// ─── StabMeter ────────────────────────────────────────────────────────────────

function StabMeter({ label, pct, color, valueLabel }: {
  label: string; pct: number; color: string; valueLabel: string;
}) {
  return (
    <View style={s.stabRow}>
      <Text style={s.stabName}>{label}</Text>
      <View style={s.stabTrack}>
        <View style={[s.stabFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[s.stabVal, { color }]}>{valueLabel}</Text>
    </View>
  );
}

// ─── Manobra item ─────────────────────────────────────────────────────────────

type MnvStatus = 'done' | 'next' | 'future';

const mnvBg     = { done: 'rgba(0,255,136,0.04)',  next: 'rgba(255,179,0,0.05)',  future: 'rgba(0,200,255,0.03)' };
const mnvBorder = { done: 'rgba(0,255,136,0.2)',   next: 'rgba(255,179,0,0.35)', future: 'rgba(0,200,255,0.15)' };
const mnvDotClr = { done: C.g, next: C.a, future: 'rgba(0,200,255,0.3)' };
const mnvBadgeBg= { done: 'rgba(0,255,136,0.1)',   next: 'rgba(255,179,0,0.1)',  future: 'rgba(0,200,255,0.07)' };
const mnvBadgeBd= { done: 'rgba(0,255,136,0.25)',  next: 'rgba(255,179,0,0.3)',  future: 'rgba(0,200,255,0.2)' };
const mnvBadgeC = { done: C.g, next: C.a, future: 'rgba(0,200,255,0.6)' };
const mnvBadgeT = { done: 'CONCLUÍDA', next: 'PRÓXIMA', future: '' };

function MnvItem({ status, name, meta, badgeOverride }: {
  status: MnvStatus; name: string; meta: string; badgeOverride?: string;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'next') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const badgeTxt = badgeOverride ?? mnvBadgeT[status];

  return (
    <View style={[s.mnvItem, { backgroundColor: mnvBg[status], borderColor: mnvBorder[status] }]}>
      <Animated.View style={[
        s.mnvDot,
        { backgroundColor: mnvDotClr[status] },
        status === 'next' && { opacity: pulseAnim },
      ]} />
      <Text style={s.mnvName}>{name}</Text>
      <Text style={s.mnvMeta}>{meta}</Text>
      <View style={[s.mnvBadge, { backgroundColor: mnvBadgeBg[status], borderColor: mnvBadgeBd[status] }]}>
        <Text style={[s.mnvBadgeTxt, { color: mnvBadgeC[status] }]}>{badgeTxt}</Text>
      </View>
    </View>
  );
}

// ─── Radar orbital SVG ────────────────────────────────────────────────────────

function RadarSvg({ angle, orbitNum }: { angle: number; orbitNum: number }) {
  const CX = 70, CY = 70, R = 46;
  const sx = CX + R * Math.cos(angle);
  const sy = CY + R * Math.sin(angle);

  return (
    <Svg width={140} height={140} viewBox="0 0 140 140">
      <Circle cx={CX} cy={CY} r={64} fill="none" stroke="rgba(0,200,255,0.08)" strokeWidth={1} />
      <Circle cx={CX} cy={CY} r={46} fill="none" stroke="rgba(0,200,255,0.1)"  strokeWidth={0.5} />
      <Circle cx={CX} cy={CY} r={28} fill="none" stroke="rgba(0,200,255,0.15)" strokeWidth={0.5} />
      <Line x1={CX} y1={6}  x2={CX} y2={134} stroke="rgba(0,200,255,0.07)" strokeWidth={0.5} />
      <Line x1={6}  y1={CY} x2={134} y2={CY} stroke="rgba(0,200,255,0.07)" strokeWidth={0.5} />
      <Line x1={24} y1={24} x2={116} y2={116} stroke="rgba(0,200,255,0.04)" strokeWidth={0.5} />
      <Line x1={116} y1={24} x2={24} y2={116} stroke="rgba(0,200,255,0.04)" strokeWidth={0.5} />
      {/* Marte */}
      <Circle cx={CX} cy={CY} r={10} fill="#c1440e" opacity={0.85} />
      <SvgText x={CX} y={CY + 4} textAnchor="middle" fontFamily="ShareTechMono" fontSize={7} fill="rgba(255,255,255,0.6)">MRS</SvgText>
      {/* Órbita */}
      <Ellipse cx={CX} cy={CY} rx={R} ry={R} fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth={0.8} strokeDasharray="3 4" />
      {/* Sweep */}
      <Line x1={CX} y1={CY} x2={sx} y2={sy} stroke="rgba(0,255,136,0.2)" strokeWidth={1} />
      {/* Nave */}
      <Circle cx={sx} cy={sy} r={4.5} fill={C.b} />
      <Circle cx={sx} cy={sy} r={7}   fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth={0.8} />
      {/* Label */}
      <SvgText x={72} y={44} fontFamily="ShareTechMono" fontSize={7} fill="rgba(200,232,255,0.25)">320km</SvgText>
    </Svg>
  );
}

// ─── Mapa de trajetória SVG ───────────────────────────────────────────────────

function TrajMap({ shipT, dist }: { shipT: number; dist: number }) {
  const W = SW - 48 - 12;
  const sc = (x: number) => x * (W / 220);

  // Posição da nave interpolada na trajetória Hohmann
  const T = Math.min(1, shipT);
  const nx = sc(104 + (196 - 104) * T);
  const ny = sc(100 + (56 - 100) * T - Math.sin(T * Math.PI) * 44);

  return (
    <Svg width={W} height={sc(160)} viewBox={`0 0 ${W} ${sc(160)}`}>
      {/* Sol */}
      <Circle cx={sc(36)} cy={sc(100)} r={sc(14)} fill="#f5a623" opacity={0.9} />
      <Circle cx={sc(36)} cy={sc(100)} r={sc(20)} fill="none" stroke="rgba(245,166,35,0.15)" strokeWidth={1.5} />
      <SvgText x={sc(36)} y={sc(118)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.muted}>SOL</SvgText>

      {/* Órbita Terra */}
      <Ellipse cx={sc(36)} cy={sc(100)} rx={sc(68)} ry={sc(44)} fill="none" stroke="rgba(0,200,255,0.12)" strokeWidth={0.5} strokeDasharray="2 3" />

      {/* Terra */}
      <Circle cx={sc(104)} cy={sc(100)} r={sc(6)} fill="#1a6fff" />
      <SvgText x={sc(104)} y={sc(116)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.muted}>TERRA</SvgText>

      {/* Órbita Marte */}
      <Ellipse cx={sc(36)} cy={sc(100)} rx={sc(168)} ry={sc(108)} fill="none" stroke="rgba(193,68,14,0.12)" strokeWidth={0.5} strokeDasharray="2 3" />

      {/* Marte */}
      <Circle cx={sc(196)} cy={sc(56)} r={sc(5)} fill="#c1440e" opacity={0.9} />
      <SvgText x={sc(196)} y={sc(70)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.muted}>MARTE</SvgText>

      {/* Trajetória Hohmann */}
      <Path d={`M${sc(104)} ${sc(100)} Q${sc(155)} ${sc(18)} ${sc(196)} ${sc(56)}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1.5} strokeDasharray="5 4" />

      {/* D+0 marker */}
      <Circle cx={sc(104)} cy={sc(100)} r={sc(2.5)} fill={C.g} opacity={0.7} />
      <SvgText x={sc(88)} y={sc(100)} fontFamily="ShareTechMono" fontSize={sc(7)} fill="rgba(0,255,136,0.5)">D+0</SvgText>

      {/* Nave */}
      <Circle cx={nx} cy={ny} r={sc(4)} fill={C.b} />
      <Circle cx={nx} cy={ny} r={sc(7)} fill="none" stroke="rgba(0,200,255,0.35)" strokeWidth={0.8} />
      <SvgText x={nx + sc(5)} y={ny - sc(6)} fontFamily="ShareTechMono" fontSize={sc(7)} fill={C.b}>ARES-VII</SvgText>

      {/* Legenda */}
      <SvgText x={sc(110)} y={sc(152)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(7)} fill="rgba(200,232,255,0.2)">Transferência de Hohmann</SvgText>
    </Svg>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function OrbitScreen() {
  const router = useRouter();
  const { mission } = useMission();

  // Valores ao vivo
  const [alt,  setAlt]  = useState(320);
  const [dv,   setDv]   = useState(48);
  const [vel,  setVel]  = useState(24.7);
  const [dist, setDist] = useState(mission.distanceFromEarth);
  const [apo,  setApo]  = useState(328);
  const [inc,  setInc]  = useState(28.5);
  const [ecc,  setEcc]  = useState(0.0012);
  const [altStab, setAltStab] = useState(96);

  // Radar orbital
  const angleRef   = useRef(mission.shipAngle);
  const [angle,    setAngle]    = useState(mission.shipAngle);
  const [orbitNum, setOrbitNum] = useState(847);
  const prevAngle  = useRef(angleRef.current);

  // Nave na trajetória
  const trajTRef = useRef(0.62);
  const [shipT, setShipT] = useState(0.62);

  // Badge de estável pulsando
  const pulsAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsAnim, { toValue: 1,   duration: 1000, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(pulsAnim, { toValue: 0.4, duration: 1000, easing: Easing.ease, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Animação do radar (60fps)
  useEffect(() => {
    let rafId: any;
    const tick = () => {
      angleRef.current += 0.01;

      // Conta órbita ao completar volta
      const prev = prevAngle.current;
      const curr = angleRef.current;
      const threshold = 3 * Math.PI / 2;
      if (prev < threshold && curr >= threshold) {
        setOrbitNum(n => n + 1);
      }
      prevAngle.current = curr;

      setAngle(angleRef.current);

      // Nave na trajetória
      trajTRef.current += 0.0008;
      if (trajTRef.current > 1.4) trajTRef.current = 0.62;
      setShipT(Math.min(1, (trajTRef.current - 0.62) / 0.8));

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Telemetria ao vivo (2s)
  useEffect(() => {
    const id = setInterval(() => {
      setAlt(v  => parseFloat(Math.max(310, Math.min(330, v + (Math.random() - 0.5) * 0.08)).toFixed(1) as any));
      setDv(v   => parseFloat(Math.max(40,  Math.min(55,  v + (Math.random() - 0.52) * 0.03)).toFixed(1) as any));
      setVel(v  => parseFloat(Math.max(24,  Math.min(25.5,v + (Math.random() - 0.5)  * 0.02)).toFixed(2) as any));
      setDist(v => parseFloat(Math.max(0,   v + (Math.random() - 0.48) * 0.02).toFixed(1) as any));
      setApo(v  => parseFloat(Math.max(320, Math.min(340, v + (Math.random() - 0.5)  * 0.1)).toFixed(1) as any));
      setInc(v  => parseFloat(Math.max(28,  Math.min(29,  v + (Math.random() - 0.5)  * 0.002)).toFixed(3) as any));
      setEcc(v  => parseFloat(Math.max(0,   Math.min(0.002, v + (Math.random() - 0.5) * 0.00001)).toFixed(4) as any));
      setAltStab(v => parseFloat(Math.max(90, Math.min(100, v + (Math.random() - 0.5) * 0.5)).toFixed(0) as any));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const badgeBorderColor = pulsAnim.interpolate({
    inputRange:  [0.4, 1],
    outputRange: ['rgba(0,255,136,0.3)', 'rgba(0,255,136,1)'],
  });

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
          <Text style={s.title}>MONITORAMENTO ORBITAL</Text>
          <Animated.View style={[s.badgeOk, { borderColor: badgeBorderColor }]}>
            <Text style={s.badgeOkTxt}>ESTÁVEL</Text>
          </Animated.View>
        </View>

        {/* Stat cards */}
        <View style={s.threeCol}>
          <StatBox value={`${alt} km`}  label="Altitude"        color={C.g} />
          <StatBox value="128 min"       label="Período orbital" color={C.b} />
          <StatBox value={`${dv} m/s`}  label="Δv disponível"   color={C.a} />
        </View>

        {/* Mapa de trajetória */}
        <Panel label="MAPA DE TRANSFERÊNCIA INTERPLANETÁRIA">
          <View style={s.trajRow}>
            <TrajMap shipT={shipT} dist={dist} />
            <View style={s.trajParams}>
              <Text style={s.trajSubheader}>Elementos orbitais</Text>
              <Row label="Tipo trajetória" value="HOHMANN"           vc={C.b} />
              <Row label="Semi-eixo maior" value="1.26 UA" />
              <Row label="Excentricidade"  value={ecc.toString()}    vc={C.g} />
              <Row label="Inclinação"      value={`${inc}°`} />
              <Row label="Arg. periélio"   value="112.4°" />
              <Row label="Ascensão reta"   value="247.3°" />
              <Divider />
              <Row label="Velocidade"      value={`${vel} km/s`} />
              <Row label="Dist. Terra"     value={`${dist} M km`}    vc={C.b} />
              <Row label="Dist. Marte"     value="174.3 M km"        vc={C.a} />
              <Row label="Ângulo fase"     value="44.8°" />
            </View>
          </View>
        </Panel>

        {/* Radar + Estabilidade */}
        <View style={s.twoCol}>
          <Panel label="RADAR ORBITAL — MARTE" style={{ flex: 1 }}>
            <View style={{ alignItems: 'center', marginVertical: 4 }}>
              <RadarSvg angle={angle} orbitNum={orbitNum} />
            </View>
            <Row label="Alt. pericenter" value="312 km"         vc={C.g} />
            <Row label="Alt. apocenter"  value={`${apo} km`}    vc={C.g} />
            <Row label="Período"         value="128.4 min" />
            <Row label="Órbita nº"       value={String(orbitNum)} vc={C.b} />
          </Panel>

          <Panel label="ESTABILIDADE ORBITAL" style={{ flex: 1 }}>
            <StabMeter label="Altitude"      pct={altStab} color={C.g} valueLabel={`${altStab}%`} />
            <StabMeter label="Excentricidade" pct={99}     color={C.g} valueLabel="99%" />
            <StabMeter label="Inclinação"    pct={94}      color={C.g} valueLabel="94%" />
            <StabMeter label="Velocidade"    pct={91}      color={C.g} valueLabel="91%" />
            <StabMeter label="Δv reserve"    pct={48}      color={C.a} valueLabel={`${dv} m/s`} />
            <Divider />
            <Row label="Avaliação geral"   value="ESTÁVEL"      vc={C.g} />
            <Row label="Risco de decay"    value="BAIXO"        vc={C.g} />
            <Row label="Vida útil est."    value="+380 dias" />
            <Row label="Drag atmosférico"  value="DESPREZÍVEL"  vc={C.g} />
          </Panel>
        </View>

        {/* Manobras planejadas */}
        <Panel label="MANOBRAS PLANEJADAS">
          <MnvItem status="done"   name="TCM-1 — Correção de trajetória pós-lançamento"   meta="D+2 • Δv = 8.3 m/s" />
          <MnvItem status="done"   name="TCM-2 — Ajuste de trajetória intermediária"       meta="D+90 • Δv = 12.4 m/s" />
          <MnvItem status="next"   name="TCM-3 — Correção de aproximação final"            meta="D+178 • Δv = 6.8 m/s estimado" />
          <MnvItem status="future" name="MOI — Mars Orbit Insertion (queima principal)"    meta="D+225 • Δv = ~900 m/s estimado" badgeOverride="D+225" />
          <MnvItem status="future" name="Deorbit + descida à superfície marciana"          meta="D+231 • Zona LS-7, Planalto Acidalia" badgeOverride="D+231" />
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

  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,255,0.2)', paddingBottom: 8, marginBottom: 10, gap: 8 },
  backBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,200,255,0.3)', backgroundColor: 'rgba(0,200,255,0.07)' },
  backTxt:    { fontFamily: 'ShareTechMono', fontSize: 10, color: C.b, letterSpacing: 1 },
  title:      { fontFamily: 'Orbitron-Bold', fontSize: 10, color: C.b, letterSpacing: 2, flex: 1, textAlign: 'center' },
  badgeOk:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, borderWidth: 1, backgroundColor: 'rgba(0,255,136,0.1)' },
  badgeOkTxt: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.g, letterSpacing: 2 },

  threeCol: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  twoCol:   { flexDirection: 'row', gap: 8, marginBottom: 8 },

  statBox: { flex: 1, backgroundColor: 'rgba(0,200,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.12)', borderRadius: 3, padding: 8, alignItems: 'center' },
  statNum: { fontFamily: 'Orbitron-Bold', fontSize: 16, color: C.b },
  statLbl: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' },

  panel:        { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8, position: 'relative' },
  panelLabel:   { position: 'absolute', top: -1, left: 10, backgroundColor: C.bg, paddingHorizontal: 4 },
  panelLabelTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.b, letterSpacing: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  lbl: { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontFamily: 'ShareTechMono', fontSize: 11, color: C.text },

  divider: { height: 1, backgroundColor: 'rgba(0,200,255,0.1)', marginVertical: 8 },

  // Trajetória
  trajRow:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  trajParams:   { flex: 1 },
  trajSubheader:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },

  // Estabilidade
  stabRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3 },
  stabName: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, width: 80, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 },
  stabTrack:{ flex: 1, height: 5, backgroundColor: 'rgba(0,200,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  stabFill: { height: '100%', borderRadius: 2 },
  stabVal:  { fontFamily: 'ShareTechMono', fontSize: 9, width: 48, textAlign: 'right', flexShrink: 0 },

  // Manobras
  mnvItem:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 3, borderWidth: 1, marginBottom: 6 },
  mnvDot:     { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  mnvName:    { fontFamily: 'ShareTechMono', fontSize: 10, color: C.text, flex: 1 },
  mnvMeta:    { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textAlign: 'right', flexShrink: 0 },
  mnvBadge:   { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 1, borderWidth: 1, flexShrink: 0, marginLeft: 4 },
  mnvBadgeTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, letterSpacing: 1 },
});