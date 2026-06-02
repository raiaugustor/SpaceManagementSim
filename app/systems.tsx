import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const C = {
  g: '#00ff88', a: '#ffb300', r: '#ff3b3b', b: '#00c8ff',
  bg: '#020c14', panel: 'rgba(4,14,24,0.92)', border: 'rgba(0,200,255,0.22)',
  muted: 'rgba(200,232,255,0.4)', text: '#e0f4ff',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SysKey = 'prop' | 'energy' | 'comm' | 'nav' | 'thermal' | 'struct';
type Status = 'ok' | 'warn' | 'crit';

// ─── Dados dos sistemas ───────────────────────────────────────────────────────

const SYSTEMS: {
  key: SysKey; icon: string; name: string; pct: number;
  status: Status; sub: string[];
}[] = [
  { key: 'prop',    icon: '🚀', name: 'PROPULSÃO',    pct: 92, status: 'ok',   sub: ['Motor principal OK', 'Thrust: 12.4 kN'] },
  { key: 'energy',  icon: '⚡', name: 'ENERGIA',      pct: 87, status: 'ok',   sub: ['Painéis solares: 8.1 kW', 'Bateria: carregando'] },
  { key: 'comm',    icon: '📡', name: 'COMUNICAÇÃO',  pct: 62, status: 'warn', sub: ['Sinal degradado', 'Antena: reposicionando'] },
  { key: 'nav',     icon: '🧭', name: 'NAVEGAÇÃO',    pct: 95, status: 'ok',   sub: ['IMU: calibrado', 'Trajetória: nominal'] },
  { key: 'thermal', icon: '🌡️', name: 'TÉRMICO',      pct: 31, status: 'crit', sub: ['Isolamento degradado', '-187°C casco externo'] },
  { key: 'struct',  icon: '🛡️', name: 'ESTRUTURAL',   pct: 98, status: 'ok',   sub: ['Integridade: OK', 'Microimpactos: 0'] },
];

const HEALTH_BARS = [
  { name: 'Propulsão',   pct: 92, color: C.g },
  { name: 'Energia',     pct: 87, color: C.g },
  { name: 'Comunicação', pct: 62, color: C.a },
  { name: 'Navegação',   pct: 95, color: C.g },
  { name: 'Térmico',     pct: 31, color: C.r },
  { name: 'Estrutural',  pct: 98, color: C.g },
];

const LOG_ITEMS: { time: string; msg: string; level: 'ok' | 'warn' | 'crit' }[] = [
  { time: '08:21 MET', msg: 'TÉRMICO — temperatura casco caiu abaixo de -185°C',           level: 'crit' },
  { time: '07:54 MET', msg: 'COMM — intensidade de sinal reduzida para 62 dBm',             level: 'warn' },
  { time: '06:40 MET', msg: 'PROPULSÃO — combustível atingiu limiar de 20%',                level: 'warn' },
  { time: '05:12 MET', msg: 'ENERGIA — painel solar B ajustado automaticamente',            level: 'ok' },
  { time: '03:30 MET', msg: 'NAVEGAÇÃO — TCM-2 confirmada, trajetória nominal',             level: 'ok' },
  { time: '02:00 MET', msg: 'ESTRUTURAL — varredura de integridade concluída, OK',          level: 'ok' },
];

const DRAWER_CONTENT: Record<SysKey, { title: string; rows: { label: string; value: string; vc?: string }[]; rows2: { label: string; value: string; vc?: string }[]; bars?: { label: string; pct: number; color: string }[]; warning?: string }> = {
  prop: {
    title: 'PROPULSÃO — DETALHES',
    rows: [
      { label: 'Motor principal',  value: 'NOMINAL',  vc: C.g },
      { label: 'Thrust atual',     value: '12.4 kN' },
      { label: 'Isp (eficiência)', value: '452 s',    vc: C.g },
      { label: 'Pressão câmara',   value: '187 bar',  vc: C.g },
      { label: 'Temp. motor',      value: '+410°C',   vc: C.g },
    ],
    rows2: [
      { label: 'Modo operação',      value: 'CRUZEIRO', vc: C.b },
      { label: 'Combustível princ.', value: '18%',      vc: C.r },
      { label: 'Reserva RCS',        value: '34%',      vc: C.a },
      { label: 'Autonomia',          value: '~38 dias', vc: C.a },
    ],
    bars: [
      { label: 'Combustível', pct: 18, color: C.r },
      { label: 'RCS',         pct: 34, color: C.a },
    ],
  },
  energy: {
    title: 'ENERGIA — DETALHES',
    rows: [
      { label: 'Painel solar A', value: '4.2 kW', vc: C.g },
      { label: 'Painel solar B', value: '3.9 kW', vc: C.g },
      { label: 'Geração total',  value: '8.1 kW', vc: C.g },
      { label: 'Consumo atual',  value: '6.8 kW' },
      { label: 'Saldo',          value: '+1.3 kW', vc: C.g },
    ],
    rows2: [
      { label: 'Bateria',       value: '87%',    vc: C.g },
      { label: 'Tensão',        value: '28.4 V', vc: C.g },
      { label: 'Corrente',      value: '238 A' },
      { label: 'Temp. bateria', value: '+24°C',  vc: C.g },
      { label: 'Ciclos carga',  value: '142' },
    ],
    bars: [{ label: 'Bateria', pct: 87, color: C.g }],
  },
  comm: {
    title: 'COMUNICAÇÃO — DETALHES',
    rows: [
      { label: 'Intensidade sinal', value: '62 dBm',    vc: C.a },
      { label: 'Latência',          value: '4.3 min',   vc: C.a },
      { label: 'Taxa de dados',     value: '2.4 Mbps' },
      { label: 'Protocolo',         value: 'DSN X-BAND', vc: C.b },
      { label: 'Uplink',            value: 'ATIVO',      vc: C.g },
    ],
    rows2: [
      { label: 'Antena principal', value: 'REPOSICIONANDO', vc: C.a },
      { label: 'Antena backup',    value: 'STANDBY',        vc: C.g },
      { label: 'Erros de pacote',  value: '0.8%',           vc: C.a },
      { label: 'Compressão',       value: 'ATIVA' },
      { label: 'Próx. janela DSN', value: '18:30 UTC',      vc: C.b },
    ],
    bars: [{ label: 'Sinal', pct: 62, color: C.a }],
    warning: '⚠ Ação recomendada: reposicionar antena HGA para compensar ângulo solar.',
  },
  nav: {
    title: 'NAVEGAÇÃO — DETALHES',
    rows: [
      { label: 'IMU principal',     value: 'CALIBRADO', vc: C.g },
      { label: 'IMU redundante',    value: 'STANDBY',   vc: C.g },
      { label: 'Star tracker A',    value: 'ATIVO',     vc: C.g },
      { label: 'Star tracker B',    value: 'ATIVO',     vc: C.g },
      { label: 'Erro apontamento',  value: '0.002°',    vc: C.g },
    ],
    rows2: [
      { label: 'Desvio de rota',  value: '0.4 km',  vc: C.g },
      { label: 'Aceleração',      value: '0.00 m/s²' },
      { label: 'Atitude',         value: 'ESTÁVEL', vc: C.g },
      { label: 'Modo de controle', value: 'AUTO',   vc: C.b },
      { label: 'Próx. correção',  value: 'D+178' },
    ],
    bars: [],
  },
  thermal: {
    title: 'TÉRMICO — CRÍTICO ⚠',
    rows: [
      { label: 'Temp. cabine',      value: '+22°C',   vc: C.g },
      { label: 'Temp. casco ext.',  value: '-187°C',  vc: C.r },
      { label: 'Temp. motor',       value: '+18°C',   vc: C.g },
      { label: 'Delta T casco',     value: '-209°C',  vc: C.r },
      { label: 'Fluido resfr.',     value: '92%',     vc: C.g },
    ],
    rows2: [
      { label: 'Isolamento térmico',  value: 'DEGRADADO', vc: C.r },
      { label: 'Radiador primário',   value: 'ATIVO',     vc: C.g },
      { label: 'Radiador secundário', value: 'STANDBY',   vc: C.a },
      { label: 'Aquecedores cabine',  value: 'ATIVO',     vc: C.g },
      { label: 'Aquecedores tanque',  value: 'ATIVO',     vc: C.g },
    ],
    bars: [],
    warning: '⚠ AÇÃO REQUERIDA: Isolamento do painel lateral degradou 68% acima do esperado. Acionar radiador secundário e monitorar temperatura do tanque de oxigênio (risco de sublimação abaixo de -196°C).',
  },
  struct: {
    title: 'ESTRUTURAL — DETALHES',
    rows: [
      { label: 'Integridade casco',  value: '98%',    vc: C.g },
      { label: 'Microimpactos',      value: '0 eventos', vc: C.g },
      { label: 'Vibração estrutural', value: '0.002 g', vc: C.g },
      { label: 'Pressão diferencial', value: '1.01 atm', vc: C.g },
    ],
    rows2: [
      { label: 'Sensores de stress', value: 'NOMINAL', vc: C.g },
      { label: 'Juntas de selagem',  value: 'OK',      vc: C.g },
      { label: 'Painel de acesso E', value: 'TRAVADO', vc: C.g },
      { label: 'Última inspeção EVA', value: 'D+90' },
    ],
    bars: [],
  },
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

function Bar({ pct, color }: { pct: number; color: string }) {
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
      <View style={s.panelLabel}><Text style={s.panelLabelTxt}>{label}</Text></View>
      {children}
    </View>
  );
}

// ─── Anel de score ────────────────────────────────────────────────────────────

function ScoreRing({ pct }: { pct: number }) {
  const circ = 2 * Math.PI * 32;
  const offset = circ - (pct / 100) * circ;
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={32} fill="none" stroke="rgba(0,200,255,0.1)" strokeWidth={7} />
      <Circle
        cx={40} cy={40} r={32}
        fill="none" stroke={C.a} strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={`${offset}`}
        transform="rotate(-90 40 40)"
      />
      <SvgText x={40} y={36} textAnchor="middle" fontFamily="Orbitron-Bold" fontSize={14} fill={C.a}>
        {pct}%
      </SvgText>
      <SvgText x={40} y={50} textAnchor="middle" fontFamily="ShareTechMono" fontSize={8} fill={C.muted}>
        SAÚDE
      </SvgText>
    </Svg>
  );
}

// ─── Card de sistema ──────────────────────────────────────────────────────────

const statusBorderColor = { ok: 'rgba(0,255,136,0.3)', warn: 'rgba(255,179,0,0.35)', crit: 'rgba(255,59,59,0.45)' };
const statusColor       = { ok: C.g, warn: C.a, crit: C.r };
const statusLabel       = { ok: '● NOMINAL', warn: '● ATENÇÃO', crit: '● CRÍTICO' };

function SysCard({ item, onPress }: { item: typeof SYSTEMS[0]; onPress: () => void }) {
  const color = statusColor[item.status];
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (item.status === 'crit') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 350, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 350, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.sysCard, { borderColor: statusBorderColor[item.status] }]}
      activeOpacity={0.75}
    >
      <Text style={s.sysIcon}>{item.icon}</Text>
      <Text style={[s.sysName, { color }]}>{item.name}</Text>
      <Animated.Text style={[s.sysPct, { color, opacity: item.status === 'crit' ? pulseAnim : 1 }]}>
        {item.pct}%
      </Animated.Text>
      <Animated.Text style={[s.sysStatus, { color, opacity: item.status === 'crit' ? pulseAnim : 1 }]}>
        {statusLabel[item.status]}
      </Animated.Text>
      {item.sub.map((l, i) => (
        <Text key={i} style={s.sysSub}>{l}</Text>
      ))}
      {/* Barra inferior colorida */}
      <View style={[s.sysCardBar, { backgroundColor: color }]} />
    </TouchableOpacity>
  );
}

// ─── Drawer de detalhes ───────────────────────────────────────────────────────

function DetailDrawer({ sysKey, onClose }: { sysKey: SysKey; onClose: () => void }) {
  const d = DRAWER_CONTENT[sysKey];
  const isWarning = sysKey === 'comm' || sysKey === 'thermal';

  return (
    <View style={s.drawerBox}>
      <View style={s.drawerHeader}>
        <Text style={s.drawerTitle}>{d.title}</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeBtnTxt}>FECHAR ✕</Text>
        </TouchableOpacity>
      </View>

      <View style={s.twoCol}>
        <View style={{ flex: 1 }}>
          {d.rows.map((r, i) => (
            <Row key={i} label={r.label} value={r.value} vc={r.vc} />
          ))}
          {d.bars?.slice(0, 1).map((b, i) => (
            <View key={i}>
              <Bar pct={b.pct} color={b.color} />
            </View>
          ))}
        </View>
        <View style={[{ flex: 1 }, s.colGap]}>
          {d.rows2.map((r, i) => (
            <Row key={i} label={r.label} value={r.value} vc={r.vc} />
          ))}
          {d.bars?.slice(1).map((b, i) => (
            <View key={i}>
              <Bar pct={b.pct} color={b.color} />
            </View>
          ))}
        </View>
      </View>

      {d.warning && (
        <>
          <View style={s.divider} />
          <Text style={[s.warningTxt, { color: isWarning && sysKey === 'thermal' ? C.r : C.a }]}>
            {d.warning}
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function SystemsScreen() {
  const router = useRouter();
  const [scanTime, setScanTime] = useState('--:--:--');
  const [openDrawer, setOpenDrawer] = useState<SysKey | null>(null);

  useEffect(() => {
    const fmt = () => {
      const n = new Date();
      const p = (v: number) => String(v).padStart(2, '0');
      return `${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
    };
    setScanTime(fmt());
    const id = setInterval(() => setScanTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

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
          <Text style={s.title}>SAÚDE DOS SISTEMAS</Text>
          <Text style={s.scanLbl}>
            VARREDURA: <Text style={{ color: C.b }}>{scanTime}</Text>
          </Text>
        </View>

        {/* Diagnóstico geral */}
        <Panel label="DIAGNÓSTICO GERAL">
          <View style={s.diagRow}>
            {/* Anel */}
            <ScoreRing pct={75} />

            {/* Resumo */}
            <View style={{ flex: 1 }}>
              <Row label="Sistemas nominais" value="4 / 6"    vc={C.g} />
              <Row label="Em atenção"        value="1 sistema" vc={C.a} />
              <Row label="Críticos"          value="1 sistema" vc={C.r} />
              <Row label="Última varredura"  value="D+142 08:33" vc={C.b} />
              <Row label="Próx. manutenção"  value="D+145 14:00" />
            </View>

            {/* Barras de saúde */}
            <View style={{ flex: 1 }}>
              {HEALTH_BARS.map(b => (
                <View key={b.name} style={s.hbarRow}>
                  <Text style={s.hbarName}>{b.name}</Text>
                  <View style={s.hbarTrack}>
                    <View style={[s.hbarFill, { width: `${b.pct}%` as any, backgroundColor: b.color }]} />
                  </View>
                  <Text style={[s.hbarVal, { color: b.color }]}>{b.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        </Panel>

        {/* Grid de cards */}
        <View style={s.sysGrid}>
          {SYSTEMS.map(sys => (
            <SysCard
              key={sys.key}
              item={sys}
              onPress={() => setOpenDrawer(openDrawer === sys.key ? null : sys.key)}
            />
          ))}
        </View>

        {/* Drawer de detalhes */}
        {openDrawer && (
          <DetailDrawer
            sysKey={openDrawer}
            onClose={() => setOpenDrawer(null)}
          />
        )}

        {/* Log de eventos */}
        <Panel label="LOG DE EVENTOS — ÚLTIMAS 6H">
          {LOG_ITEMS.map((item, i) => (
            <View key={i} style={[s.logItem, i < LOG_ITEMS.length - 1 && s.logBorder]}>
              <Text style={s.logTime}>{item.time}</Text>
              <Text style={[
                s.logMsg,
                item.level === 'crit' && { color: C.r },
                item.level === 'warn' && { color: C.a },
              ]}>
                {item.msg}
              </Text>
            </View>
          ))}
        </Panel>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const CARD_W = (require('react-native').Dimensions.get('window').width - 24 - 16) / 3;

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
  scanLbl:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted },

  panel:        { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8, position: 'relative' },
  panelLabel:   { position: 'absolute', top: -1, left: 10, backgroundColor: C.bg, paddingHorizontal: 4 },
  panelLabelTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.b, letterSpacing: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  lbl: { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontFamily: 'ShareTechMono', fontSize: 11, color: C.text },

  barTrack: { height: 4, backgroundColor: 'rgba(0,200,255,0.08)', borderRadius: 2, marginTop: 2, marginBottom: 7, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },

  twoCol:  { flexDirection: 'row', gap: 8 },
  colGap:  { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(0,200,255,0.08)' },
  divider: { height: 1, backgroundColor: 'rgba(0,200,255,0.1)', marginVertical: 8 },

  // Diagnóstico
  diagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hbarRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  hbarName:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, width: 72, textTransform: 'uppercase' },
  hbarTrack: { flex: 1, height: 5, backgroundColor: 'rgba(0,200,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  hbarFill:  { height: '100%', borderRadius: 2 },
  hbarVal:   { fontFamily: 'ShareTechMono', fontSize: 9, width: 32, textAlign: 'right' },

  // Cards
  sysGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  sysCard:   { width: CARD_W, backgroundColor: 'rgba(4,14,24,0.7)', borderWidth: 1, borderRadius: 4, padding: 10, position: 'relative', overflow: 'hidden' },
  sysCardBar:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  sysIcon:   { fontSize: 18, marginBottom: 6 },
  sysName:   { fontFamily: 'Orbitron-SemiBold', fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  sysPct:    { fontFamily: 'Orbitron-Bold', fontSize: 18, marginVertical: 4 },
  sysStatus: { fontFamily: 'ShareTechMono', fontSize: 10, letterSpacing: 1 },
  sysSub:    { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, marginTop: 2 },

  // Drawer
  drawerBox:    { backgroundColor: 'rgba(4,14,24,0.96)', borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 12, marginBottom: 8 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drawerTitle:  { fontFamily: 'Orbitron-SemiBold', fontSize: 11, color: C.b, letterSpacing: 2 },
  closeBtn:     { borderWidth: 1, borderColor: 'rgba(0,200,255,0.2)', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 },
  closeBtnTxt:  { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, letterSpacing: 1 },
  warningTxt:   { fontFamily: 'ShareTechMono', fontSize: 10, lineHeight: 17 },});