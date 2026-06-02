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
import Svg, {
    Circle, Ellipse,
    Path, Text as SvgText
} from 'react-native-svg';
import { useMission } from '../context/MissionContext';

const { width: SW } = Dimensions.get('window');

const C = {
  g: '#00ff88', a: '#ffb300', r: '#ff3b3b', b: '#00c8ff',
  panel: 'rgba(4,14,24,0.92)', border: 'rgba(0,200,255,0.22)',
  bg: '#020c14', text: '#c8e8ff',
  muted: 'rgba(200,232,255,0.4)', dimmer: 'rgba(200,232,255,0.25)',
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function Row({ label, value, vc = C.text, small = false }: {
  label: string; value: string; vc?: string; small?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={[s.val, { color: vc, fontSize: small ? 10 : 12 }]}>{value}</Text>
    </View>
  );
}

function BarTrack({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function Panel({ label, children, style }: {
  label: string; children: React.ReactNode; style?: object;
}) {
  return (
    <View style={[s.panel, style]}>
      <View style={s.panelLabelWrap}>
        <Text style={s.panelLabelTag}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function StatBox({ num, label, color = C.b }: {
  num: string; label: string; color?: string;
}) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statNum, { color }]}>{num}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

// ─── Anel de progresso SVG ────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle
        cx={40} cy={40} r={r}
        fill="none"
        stroke="rgba(0,200,255,0.1)"
        strokeWidth={6}
      />
      <Circle
        cx={40} cy={40} r={r}
        fill="none"
        stroke={C.b}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={`${offset}`}
        transform={`rotate(-90 40 40)`}
      />
      <SvgText
        x={40} y={36}
        textAnchor="middle"
        fontFamily="Orbitron-Bold"
        fontSize={13}
        fill={C.b}
      >
        {pct}%
      </SvgText>
      <SvgText
        x={40} y={50}
        textAnchor="middle"
        fontFamily="ShareTechMono"
        fontSize={7}
        fill={C.muted}
      >
        COMPLETO
      </SvgText>
    </Svg>
  );
}

// ─── Gráfico de linha SVG ─────────────────────────────────────────────────────

function LineChart() {
  const W = SW - 48, H = 70, pts = 24;
  let velD = '', batD = '';
  for (let i = 0; i < pts; i++) {
    const x = i * (W / (pts - 1));
    const vy = H - ((24.5 + Math.sin(i * 0.5) * 0.4 - 24) / 3 * H);
    const by = H - ((80 + Math.sin(i * 0.3 + 1) * 6) / 100 * H);
    const vyClamped = Math.max(4, Math.min(H - 4, vy));
    const byClamped = Math.max(4, Math.min(H - 4, by));
    velD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + vyClamped.toFixed(1);
    batD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + byClamped.toFixed(1);
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Path d={velD} fill="none" stroke="rgba(0,200,255,0.7)" strokeWidth={1.5} />
      <Path d={batD} fill="none" stroke="rgba(0,255,136,0.6)" strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Mapa de trajetória SVG ───────────────────────────────────────────────────

function TrajectoryMap() {
  const W = SW - 48;
  const scale = W / 640;
  const H = 200 * scale;
  const shipX = useRef(370 * scale);
  const [sx, setSx] = useState(shipX.current);
  const dir = useRef(1);

  useEffect(() => {
    const id = setInterval(() => {
      shipX.current += dir.current * 0.4;
      if (shipX.current > 400 * scale || shipX.current < 340 * scale) dir.current *= -1;
      setSx(shipX.current);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const sc = (x: number) => x * scale;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Sol */}
      <Circle cx={sc(60)} cy={sc(100)} r={sc(18)} fill="#f5a623" opacity={0.9} />
      <Circle cx={sc(60)} cy={sc(100)} r={sc(24)} fill="none" stroke="rgba(245,166,35,0.2)" strokeWidth={2} />
      <SvgText x={sc(60)} y={sc(130)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(9)} fill={C.muted}>SOL</SvgText>

      {/* Órbita Terra */}
      <Ellipse cx={sc(60)} cy={sc(100)} rx={sc(100)} ry={sc(60)} fill="none" stroke="rgba(0,200,255,0.1)" strokeWidth={0.5} strokeDasharray="3 3" />

      {/* Terra */}
      <Circle cx={sc(160)} cy={sc(100)} r={sc(7)} fill="#1a6fff" />
      <SvgText x={sc(160)} y={sc(118)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.muted}>TERRA</SvgText>

      {/* Órbita Marte */}
      <Ellipse cx={sc(60)} cy={sc(100)} rx={sc(250)} ry={sc(140)} fill="none" stroke="rgba(193,68,14,0.15)" strokeWidth={0.5} strokeDasharray="3 3" />

      {/* Marte */}
      <Circle cx={sc(580)} cy={sc(60)} r={sc(6)} fill="#c1440e" />
      <SvgText x={sc(580)} y={sc(76)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.muted}>MARTE</SvgText>

      {/* Trajetória */}
      <Path d={`M${sc(160)} ${sc(100)} Q${sc(320)} ${sc(-40)} ${sc(580)} ${sc(60)}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1.5} strokeDasharray="5 4" />

      {/* Nave */}
      <Circle cx={sx} cy={sc(42)} r={sc(5)} fill={C.b} />
      <Circle cx={sx} cy={sc(42)} r={sc(9)} fill="none" stroke="rgba(0,200,255,0.35)" strokeWidth={0.8} />
      <SvgText x={sx + sc(8)} y={sc(32)} fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.b}>ARES-VII</SvgText>

      {/* Legenda */}
      <SvgText x={sc(320)} y={sc(190)} textAnchor="middle" fontFamily="ShareTechMono" fontSize={sc(8)} fill={C.dimmer}>
        Transferência de Hohmann — órbita elíptica interplanetária
      </SvgText>
    </Svg>
  );
}

// ─── Tripulação ───────────────────────────────────────────────────────────────

const CREW = [
  { init: 'JC', name: 'Cmdr. J. Chen',  role: 'COMANDANTE',       color: C.b, bg: 'rgba(0,200,255,0.12)',  border: 'rgba(0,200,255,0.3)' },
  { init: 'SR', name: 'Dr. S. Reyes',   role: 'PILOTO / ENG.',    color: C.g, bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.25)' },
  { init: 'AK', name: 'Dr. A. Kumar',   role: 'MÉDICO / CIÊNCIA', color: C.a, bg: 'rgba(255,179,0,0.1)',   border: 'rgba(255,179,0,0.25)' },
  { init: 'MV', name: 'M. Volkov',      role: 'ENG. SISTEMAS',    color: C.b, bg: 'rgba(0,200,255,0.08)',  border: 'rgba(0,200,255,0.2)' },
  { init: 'LT', name: 'Dr. L. Torres',  role: 'GEÓLOGA / EVA',    color: C.g, bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.2)' },
  { init: 'NO', name: 'N. Okonkwo',     role: 'ESPECIALISTA EVA', color: C.r, bg: 'rgba(255,59,59,0.08)',  border: 'rgba(255,59,59,0.2)' },
];

function CrewCard({ init, name, role, color, bg, border }: typeof CREW[0]) {
  return (
    <View style={s.crewCard}>
      <View style={[s.crewAvatar, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[s.crewInit, { color }]}>{init}</Text>
      </View>
      <Text style={s.crewName}>{name}</Text>
      <Text style={s.crewRole}>{role}</Text>
    </View>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

type TlStatus = 'done' | 'active' | 'future';

const TIMELINE: { status: TlStatus; title: string; sub: string }[] = [
  { status: 'done',   title: 'Lançamento — SLS Block 2',              sub: '12 JAN 2026 • Cabo Canaveral, EUA' },
  { status: 'done',   title: 'Separação do estágio de propulsão',     sub: 'D+2 • TCM-1 executada com sucesso' },
  { status: 'done',   title: 'Verificação de sistemas em cruzeiro',   sub: 'D+30 • Todos os sistemas nominais' },
  { status: 'done',   title: 'Correção de trajetória TCM-2',          sub: 'D+90 • Δv = 12.4 m/s aplicado' },
  { status: 'active', title: 'Cruzeiro interplanetário',              sub: 'D+142 • Em progresso — 78.4 M km da Terra' },
  { status: 'future', title: 'Correção de trajetória TCM-3',          sub: 'D+178 • Previsto 08 JUL 2026' },
  { status: 'future', title: 'Inserção na órbita marciana (MOI)',     sub: 'D+225 • Queima principal de freio orbital' },
  { status: 'future', title: 'Pouso na superfície de Marte',          sub: 'D+231 • Planalto Acidalia — zona LS-7' },
  { status: 'future', title: 'Retorno e reentrada na Terra',          sub: 'D+590 • Mai 2027 previsto' },
];

const tlDotColor  = { done: C.g,   active: C.b,   future: 'transparent' };
const tlDotBorder = { done: C.g,   active: C.b,   future: 'rgba(0,200,255,0.25)' };
const tlBadgeBg   = { done: 'rgba(0,255,136,0.1)', active: 'rgba(0,200,255,0.1)', future: 'rgba(255,179,0,0.07)' };
const tlBadgeBd   = { done: 'rgba(0,255,136,0.3)', active: 'rgba(0,200,255,0.35)', future: 'rgba(255,179,0,0.25)' };
const tlBadgeClr  = { done: C.g,   active: C.b,   future: C.a };
const tlBadgeTxt  = { done: 'CONCLUÍDO', active: 'ATUAL', future: 'PRÓXIMO' };

function TimelineItem({ status, title, sub }: typeof TIMELINE[0]) {
  return (
    <View style={s.tlItem}>
      <View style={[s.tlDot, { backgroundColor: tlDotColor[status], borderColor: tlDotBorder[status] }]} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={s.tlTitle}>{title}</Text>
          <View style={[s.tlBadge, { backgroundColor: tlBadgeBg[status], borderColor: tlBadgeBd[status] }]}>
            <Text style={[s.tlBadgeTxt, { color: tlBadgeClr[status] }]}>{tlBadgeTxt[status]}</Text>
          </View>
        </View>
        <Text style={s.tlSub}>{sub}</Text>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

type Tab = 'geral' | 'trajetoria' | 'tripulacao' | 'objetivos';
const TABS: { key: Tab; label: string }[] = [
  { key: 'geral',      label: 'Geral' },
  { key: 'trajetoria', label: 'Trajetória' },
  { key: 'tripulacao', label: 'Tripulação' },
  { key: 'objetivos',  label: 'Objetivos' },
];

export default function MissionDetailsScreen() {
  const router = useRouter();
  const { mission } = useMission();
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const days = Math.floor(mission.metSeconds / 86400);

  return (
    <View style={s.root}>
      {/* Cantos decorativos */}
      <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
      <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backTxt}>← DASHBOARD</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle} numberOfLines={1}>ARES-VII // DETALHES</Text>
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{mission.status}</Text>
          </View>
        </View>

        {/* Stat boxes */}
        <View style={s.threeCol}>
          <StatBox num={String(days)}                           label="Dias em missão" />
          <StatBox num={mission.distanceFromEarth.toString()}   label="Milhões km da Terra" color={C.g} />
          <StatBox num="83"                                     label="Dias até Marte" color={C.a} />
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[s.tab, activeTab === t.key && s.tabActive]}
            >
              <Text style={[s.tabTxt, activeTab === t.key && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB GERAL ──────────────────────────────────────── */}
        {activeTab === 'geral' && (
          <>
            <View style={s.twoCol}>
              <Panel label="IDENTIFICAÇÃO" style={{ flex: 1 }}>
                <Row label="Designação"     value="ARES-VII"          vc={C.b} />
                <Row label="Agência"        value="NASA / ESA" />
                <Row label="Tipo"           value="Missão tripulada" />
                <Row label="Destino"        value="MARTE"              vc={C.g} />
                <Row label="Nave"           value="Orion Mk-IV" />
                <Row label="Lançamento"     value="12 JAN 2026" />
                <Row label="Chegada prev."  value="03 OUT 2026"        vc={C.a} />
              </Panel>

              <Panel label="PROGRESSO" style={{ flex: 1 }}>
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <ProgressRing pct={63} />
                </View>
                <Row label="Fase atual"    value="CRUZEIRO"     vc={C.b} small />
                <Row label="Próxima fase"  value="INS. ORBITAL" vc={C.a} small />
                <Row label="Retorno prev." value="MAI 2027"           small />
                <Divider />
                <Row label="Dist. percorrida" value="289.7 M km" />
                <Row label="Dist. restante"   value="174.3 M km" vc={C.a} />
              </Panel>
            </View>

            <Panel label="VELOCIDADE E ENERGIA — HISTÓRICO 24H">
              <View style={{ marginVertical: 8 }}>
                <LineChart />
              </View>
              <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'flex-end' }}>
                <Text style={s.chartLegend}><Text style={{ color: C.b }}>—— </Text>Velocidade (km/s)</Text>
                <Text style={s.chartLegend}><Text style={{ color: C.g }}>—— </Text>Energia (% bat)</Text>
              </View>
            </Panel>
          </>
        )}

        {/* ── TAB TRAJETÓRIA ─────────────────────────────────── */}
        {activeTab === 'trajetoria' && (
          <>
            <Panel label="MAPA DE TRAJETÓRIA">
              <TrajectoryMap />
            </Panel>
            <View style={s.twoCol}>
              <Panel label="PARÂMETROS ORBITAIS" style={{ flex: 1 }}>
                <Row label="Trajetória"     value="HOHMANN"  vc={C.b} small />
                <Row label="Periélio"       value="1.00 UA" />
                <Row label="Afélio"         value="1.52 UA" />
                <Row label="Semi-eixo"      value="1.26 UA" />
                <Row label="Inclinação"     value="1.85°" />
                <Row label="Período"        value="259 dias" />
              </Panel>
              <Panel label="MANOBRAS PREVISTAS" style={{ flex: 1 }}>
                <Row label="Correção curso" value="D+165"  vc={C.a} />
                <Row label="Queima TCM-3"   value="D+178"  vc={C.a} />
                <Row label="Ins. orbital"   value="D+225"  vc={C.a} />
                <Row label="Descida"        value="D+231" />
                <Row label="Decolagem"      value="D+440" />
                <Row label="Retorno Terra"  value="D+590" />
              </Panel>
            </View>
          </>
        )}

        {/* ── TAB TRIPULAÇÃO ─────────────────────────────────── */}
        {activeTab === 'tripulacao' && (
          <>
            <View style={s.crewGrid}>
              {CREW.map(c => <CrewCard key={c.init} {...c} />)}
            </View>
            <Panel label="SAÚDE DA TRIPULAÇÃO">
              <View style={s.threeCol}>
                <View>
                  <Row label="Pressão cabine" value="1.02 atm" vc={C.g} />
                  <BarTrack pct={51} color={C.g} />
                </View>
                <View>
                  <Row label="O₂ disponível" value="94%" vc={C.g} />
                  <BarTrack pct={94} color={C.g} />
                </View>
                <View>
                  <Row label="Radiação acum." value="312 mSv" vc={C.a} />
                  <BarTrack pct={62} color={C.a} />
                </View>
              </View>
              <Divider />
              <Row label="Próx. janela com Terra" value="D+142 / 18:30 UTC" vc={C.b} />
            </Panel>
          </>
        )}

        {/* ── TAB OBJETIVOS ──────────────────────────────────── */}
        {activeTab === 'objetivos' && (
          <Panel label="LINHA DO TEMPO DA MISSÃO">
            <View style={s.timeline}>
              <View style={s.tlLine} />
              {TIMELINE.map((item, i) => (
                <TimelineItem key={i} {...item} />
              ))}
            </View>
          </Panel>
        )}

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

  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,255,0.2)', paddingBottom: 8, marginBottom: 10, gap: 8 },
  backBtn:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,200,255,0.3)', backgroundColor: 'rgba(0,200,255,0.07)' },
  backTxt:     { fontFamily: 'ShareTechMono', fontSize: 10, color: C.b, letterSpacing: 1 },
  screenTitle: { fontFamily: 'Orbitron-Bold', fontSize: 11, color: C.b, letterSpacing: 2, flex: 1, textAlign: 'center' },
  badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, borderWidth: 1, borderColor: C.g, backgroundColor: 'rgba(0,255,136,0.1)' },
  badgeTxt:    { fontFamily: 'ShareTechMono', fontSize: 9, color: C.g, letterSpacing: 2 },

  threeCol: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  twoCol:   { flexDirection: 'row', gap: 8, marginBottom: 8 },

  statBox: { flex: 1, backgroundColor: 'rgba(0,200,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.12)', borderRadius: 3, padding: 10, alignItems: 'center' },
  statNum: { fontFamily: 'Orbitron-Bold', fontSize: 20, color: C.b },
  statLbl: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, textAlign: 'center' },

  tabs:       { flexDirection: 'row', gap: 4, marginBottom: 10, flexWrap: 'wrap' },
  tab:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,200,255,0.2)' },
  tabActive:  { borderColor: C.b, backgroundColor: 'rgba(0,200,255,0.08)' },
  tabTxt:     { fontFamily: 'ShareTechMono', fontSize: 10, color: 'rgba(200,232,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },
  tabTxtActive:{ color: C.b },

  panel:         { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8, position: 'relative' },
  panelLabelWrap:{ position: 'absolute', top: -1, left: 10, backgroundColor: C.bg, paddingHorizontal: 4 },
  panelLabelTag: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.b, letterSpacing: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  lbl: { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontFamily: 'ShareTechMono', fontSize: 12, color: C.text },

  barTrack: { height: 4, backgroundColor: 'rgba(0,200,255,0.1)', borderRadius: 2, marginTop: 2, marginBottom: 6, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },

  divider: { height: 1, backgroundColor: 'rgba(0,200,255,0.1)', marginVertical: 8 },

  chartLegend: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.dimmer },

  crewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  crewCard: { width: (SW - 24 - 16) / 3, backgroundColor: 'rgba(0,200,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.15)', borderRadius: 3, padding: 8, alignItems: 'center' },
  crewAvatar:{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  crewInit:  { fontFamily: 'Orbitron-Bold', fontSize: 11 },
  crewName:  { fontFamily: 'ShareTechMono', fontSize: 10, color: '#e0f4ff', marginBottom: 2, textAlign: 'center' },
  crewRole:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, letterSpacing: 0.5, textAlign: 'center' },

  timeline: { paddingLeft: 20, position: 'relative' },
  tlLine:   { position: 'absolute', left: 26, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(0,200,255,0.2)' },
  tlItem:   { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  tlDot:    { width: 8, height: 8, borderRadius: 4, borderWidth: 1, marginTop: 4, flexShrink: 0 },
  tlTitle:  { fontFamily: 'ShareTechMono', fontSize: 11, color: '#e0f4ff', flex: 1 },
  tlSub:    { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, marginTop: 1 },
  tlBadge:  { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 1, borderWidth: 1, flexShrink: 0 },
  tlBadgeTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, letterSpacing: 1 },
});