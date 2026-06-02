import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMission } from '../context/MissionContext';

const { width: SW } = Dimensions.get('window');

const C = {
  g: '#00ff88', a: '#ffb300', r: '#ff3b3b', b: '#00c8ff',
  bg: '#020c14', panel: 'rgba(4,14,24,0.92)', border: 'rgba(0,200,255,0.22)',
  muted: 'rgba(200,232,255,0.4)', text: '#e0f4ff',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MsgDir = 'RX' | 'TX';
type MsgStatus = 'OK' | 'ACK' | 'LIDO' | 'ENVIANDO';

interface Message {
  id: number;
  time: string;
  dir: MsgDir;
  text: string;
  status: MsgStatus;
}

// ─── Dados iniciais ───────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  { id: 1, time: 'D+142 08:31', dir: 'RX', text: 'TCM-3 parâmetros aprovados. Executar D+178 conforme planejado.', status: 'OK' },
  { id: 2, time: 'D+142 07:50', dir: 'TX', text: 'Telemetria automática — pacote 142-089. Sistemas nominais.', status: 'ACK' },
  { id: 3, time: 'D+142 07:44', dir: 'RX', text: 'Alerta: monitorar sistema térmico. Acionar radiador secundário se T_ext < -190°C.', status: 'LIDO' },
  { id: 4, time: 'D+141 22:15', dir: 'TX', text: 'Relatório de status — D+141. Combustível: 18%. Todos na cabine.', status: 'ACK' },
  { id: 5, time: 'D+141 18:30', dir: 'RX', text: 'Janela DSN confirmada. Uplink 8.085 GHz, downlink 8.425 GHz, duração 4h.', status: 'OK' },
];

const STATIONS = [
  { id: 'DSS-43', local: 'Canberra',  elev: '38.4°', status: 'ATIVO',     statusColor: C.g, dotStatus: 'active' as const, extraLabel: 'Elevação',    extraColor: C.g },
  { id: 'DSS-14', local: 'Goldstone', elev: '12.1°', status: 'AGUARDANDO', statusColor: C.muted, dotStatus: 'idle' as const, extraLabel: 'Elevação', extraColor: C.text },
  { id: 'DSS-63', local: 'Madri',     elev: '4.8°',  status: '18:30 UTC',  statusColor: C.a, dotStatus: 'next' as const, extraLabel: 'Próx. janela', extraColor: C.a },
];

const dotColor = { active: C.g, idle: C.muted, next: C.a };

// ─── Utilitários ──────────────────────────────────────────────────────────────

function Row({ label, value, vc = C.text, small = false }: {
  label: string; value: string; vc?: string; small?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={[s.val, { color: vc, fontSize: small ? 10 : 11 }]}>{value}</Text>
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

// ─── Barras de sinal animadas ─────────────────────────────────────────────────

function SignalBars({ level }: { level: number }) {
  const NUM = 14;
  const pct = level / NUM;
  const color = pct < 0.35 ? C.r : pct < 0.6 ? C.a : C.g;

  return (
    <View style={s.sigBarsWrap}>
      {Array.from({ length: NUM }, (_, i) => {
        const h = 6 + i * 2;
        const active = i < level;
        return (
          <View
            key={i}
            style={[
              s.sigBar,
              { height: h, backgroundColor: active ? color : 'rgba(0,200,255,0.1)' },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Espectro de frequência SVG ───────────────────────────────────────────────

function SpectrumChart() {
  const W = SW - 48, H = 80;
  const pts = 60;
  let pathD = '';
  for (let x = 0; x < pts; x++) {
    const px = (x / (pts - 1)) * W;
    const center = pts / 2;
    const dist = Math.abs(x - center);
    const spike = Math.exp(-dist * dist / (pts * 0.08)) * (H - 8);
    const noise = Math.random() * 8;
    const py = H - Math.min(H - 2, spike + noise);
    pathD += (x === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1);
  }

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Path
        d={`${pathD} L${W} ${H} L0 ${H} Z`}
        fill="rgba(0,200,255,0.08)"
      />
      <Path d={pathD} fill="none" stroke={C.b} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CommsScreen() {
  const router   = useRouter();
  const { mission } = useMission();

  // Valores animados
  const [dbm,     setDbm]     = useState(62);
  const [lat,     setLat]     = useState(4.3);
  const [ang,     setAng]     = useState(14.2);
  const [pktErr,  setPktErr]  = useState(0.8);
  const [sigLevel, setSigLevel] = useState(4);
  const [handoff, setHandoff] = useState(2 * 3600 + 14 * 60 + 38);

  // Formulário de mensagem
  const [messages,  setMessages]  = useState<Message[]>(INITIAL_MESSAGES);
  const [compose,   setCompose]   = useState('');
  const [inputError, setInputError] = useState('');
  const msgIdRef = useRef(100);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Pulse animado para o TX dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Tick dos valores ao vivo
  useEffect(() => {
    const id = setInterval(() => {
      setDbm(v  => parseFloat(Math.max(45, Math.min(78, v + (Math.random() - 0.5) * 0.4)).toFixed(0) as any));
      setLat(v  => parseFloat(Math.max(4.0, Math.min(4.8, v + (Math.random() - 0.5) * 0.02)).toFixed(1) as any));
      setAng(v  => parseFloat(Math.max(12, Math.min(18, v + (Math.random() - 0.5) * 0.1)).toFixed(1) as any));
      setPktErr(v => parseFloat(Math.max(0.3, Math.min(2.0, v + (Math.random() - 0.5) * 0.05)).toFixed(1) as any));
      setSigLevel(v => Math.max(2, Math.min(14, v + (Math.random() > 0.55 ? 1 : -1))));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Contagem regressiva de handoff
  useEffect(() => {
    const id = setInterval(() => setHandoff(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const formatHandoff = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}`;
  };

  const formatNow = () => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `D+142 ${p(now.getUTCHours())}:${p(now.getUTCMinutes())}`;
  };

  // ── Envio de mensagem com validação ──────────────────────────────────────────
  const handleSend = () => {
    // Validação: campo vazio
    if (!compose.trim()) {
      setInputError('Campo obrigatório — digite uma mensagem antes de enviar.');
      return;
    }
    // Validação: mínimo de caracteres
    if (compose.trim().length < 4) {
      setInputError('Mensagem muito curta — mínimo de 4 caracteres.');
      return;
    }

    setInputError('');
    const id = ++msgIdRef.current;

    const newMsg: Message = {
      id,
      time: formatNow(),
      dir: 'TX',
      text: compose.trim(),
      status: 'ENVIANDO',
    };

    setMessages(prev => [newMsg, ...prev]);
    setCompose('');

    // Simula ACK após latência
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'ACK' } : m)
      );
    }, lat * 1000 + 500);
  };

  const statusColor: Record<MsgStatus, string> = {
    OK: C.g, ACK: C.g, LIDO: C.a, ENVIANDO: C.a,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.root}>
        <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
        <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backTxt}>← DASHBOARD</Text>
            </TouchableOpacity>
            <Text style={s.title}>COMUNICAÇÕES</Text>
            <View style={s.badgeWarn}>
              <Text style={s.badgeWarnTxt}>SINAL FRACO</Text>
            </View>
          </View>

          {/* Stat cards */}
          <View style={s.threeCol}>
            <StatBox value={`${dbm} dBm`}   label="Intensidade"   color={C.a} />
            <StatBox value={`${lat} min`}    label="Latência"      color={C.a} />
            <StatBox value="2.4 Mbps"        label="Taxa de dados" color={C.g} />
          </View>

          {/* Sinal em tempo real */}
          <Panel label="SINAL EM TEMPO REAL">
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                {/* TX indicator */}
                <View style={s.row}>
                  <Text style={s.lbl}>Status do link</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Animated.View style={[s.txDot, { opacity: pulseAnim }]} />
                    <Text style={{ fontFamily: 'ShareTechMono', fontSize: 10, color: C.g }}>TRANSMITINDO</Text>
                  </View>
                </View>
                <Row label="Protocolo"       value="DSN X-BAND"  vc={C.b} />
                <Row label="Frequência"      value="8.425 GHz" />
                <Row label="Polarização"     value="RHCP" />
                <Row label="Erros de pacote" value={`${pktErr}%`} vc={C.a} />
                <Row label="Compressão"      value="SIM — 3.2×"  vc={C.g} />
              </View>

              <View style={[{ flex: 1 }, s.colGap]}>
                <Text style={[s.lbl, { marginBottom: 6 }]}>Intensidade de sinal</Text>
                <SignalBars level={sigLevel} />
                <View style={s.sigLabels}>
                  {['CRÍTICO', 'FRACO', 'BOM', 'ÓTIMO'].map(l => (
                    <Text key={l} style={s.sigLabel}>{l}</Text>
                  ))}
                </View>
                <Divider />
                <Row label="Antena ativa"      value="HGA — AJUSTANDO" vc={C.a} small />
                <Row label="Antena backup"     value="MGA — STANDBY"   small />
                <Row label="Ângulo apontamento" value={`${ang}°`}      small />
              </View>
            </View>
          </Panel>

          {/* Espectro */}
          <Panel label="ESPECTRO DE FREQUÊNCIA — ÚLTIMOS 60S">
            <View style={{ marginVertical: 6 }}>
              <SpectrumChart />
            </View>
            <View style={s.freqLabels}>
              {['8.420 GHz', '8.425 GHz', '8.430 GHz'].map(l => (
                <Text key={l} style={s.freqLabel}>{l}</Text>
              ))}
            </View>
          </Panel>

          {/* Estações DSN */}
          <Panel label="REDE DSN — ESTAÇÕES TERRESTRES">
            <View style={s.stnGrid}>
              {STATIONS.map(stn => (
                <View key={stn.id} style={s.stnCard}>
                  <View style={[s.stnDot, { backgroundColor: dotColor[stn.dotStatus] }]} />
                  <Text style={s.stnName}>{stn.id}</Text>
                  <Row label="Local"         value={stn.local} small />
                  <Row label="Elevação"      value={stn.elev}  vc={stn.extraColor} small />
                  <Row label={stn.extraLabel} value={stn.status} vc={stn.statusColor} small />
                </View>
              ))}
            </View>
            <Divider />
            <Row label="Handoff DSS-43 → DSS-14" value={`Em ${formatHandoff(handoff)}`} vc={C.a} />
          </Panel>

          {/* Log de mensagens + formulário */}
          <Panel label="LOG DE MENSAGENS — ÚLTIMAS TRANSMISSÕES">
            {messages.map(msg => (
              <View key={msg.id} style={s.msgItem}>
                <Text style={s.msgTime}>{msg.time}</Text>
                <View style={[s.msgDirBadge, msg.dir === 'TX' ? s.msgTX : s.msgRX]}>
                  <Text style={[s.msgDirTxt, { color: msg.dir === 'TX' ? C.g : C.b }]}>{msg.dir}</Text>
                </View>
                <Text style={s.msgTxt} numberOfLines={2}>{msg.text}</Text>
                <Text style={[s.msgStatus, { color: statusColor[msg.status] }]}>{msg.status}</Text>
              </View>
            ))}

            {/* ── Campo de composição com validação ── */}
            <View style={s.composeRow}>
              <TextInput
                style={[s.composeInput, inputError ? s.composeInputError : null]}
                placeholder="Digitar mensagem para controle em terra..."
                placeholderTextColor="rgba(200,232,255,0.25)"
                value={compose}
                onChangeText={text => {
                  setCompose(text);
                  if (inputError) setInputError('');
                }}
                onSubmitEditing={handleSend}
                maxLength={120}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={handleSend} style={s.sendBtn}>
                <Text style={s.sendBtnTxt}>ENVIAR ↑</Text>
              </TouchableOpacity>
            </View>

            {/* Mensagem de erro de validação */}
            {inputError ? (
              <Text style={s.errorTxt}>⚠ {inputError}</Text>
            ) : null}

            <Text style={s.latencyNote}>
              Mensagem chegará em Terra em aprox.{' '}
              <Text style={{ color: C.a }}>{lat} min</Text>
              {' '}— latência de sinal.
            </Text>
          </Panel>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  title:       { fontFamily: 'Orbitron-Bold', fontSize: 11, color: C.b, letterSpacing: 2, flex: 1, textAlign: 'center' },
  badgeWarn:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, borderWidth: 1, borderColor: C.a, backgroundColor: 'rgba(255,179,0,0.1)' },
  badgeWarnTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.a, letterSpacing: 2 },

  threeCol: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  twoCol:   { flexDirection: 'row', gap: 8 },
  colGap:   { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(0,200,255,0.08)' },

  statBox: { flex: 1, backgroundColor: 'rgba(0,200,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.12)', borderRadius: 3, padding: 8, alignItems: 'center' },
  statNum: { fontFamily: 'Orbitron-Bold', fontSize: 18, color: C.b },
  statLbl: { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' },

  panel:        { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, paddingTop: 18, marginBottom: 8, position: 'relative' },
  panelLabel:   { position: 'absolute', top: -1, left: 10, backgroundColor: C.bg, paddingHorizontal: 4 },
  panelLabelTxt:{ fontFamily: 'ShareTechMono', fontSize: 9, color: C.b, letterSpacing: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  lbl: { fontFamily: 'ShareTechMono', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontFamily: 'ShareTechMono', fontSize: 11, color: C.text },

  divider: { height: 1, backgroundColor: 'rgba(0,200,255,0.1)', marginVertical: 8 },

  txDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.g },

  // Barras de sinal
  sigBarsWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 36, marginBottom: 4 },
  sigBar:      { width: 9, borderRadius: 1 },
  sigLabels:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sigLabel:    { fontFamily: 'ShareTechMono', fontSize: 8, color: C.muted },

  // Espectro
  freqLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  freqLabel:  { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted },

  // Estações
  stnGrid: { flexDirection: 'row', gap: 6 },
  stnCard: { flex: 1, backgroundColor: 'rgba(0,200,255,0.03)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.12)', borderRadius: 3, padding: 8, position: 'relative' },
  stnDot:  { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 8 },
  stnName: { fontFamily: 'Orbitron-SemiBold', fontSize: 9, color: C.b, letterSpacing: 1, marginBottom: 4 },

  // Log de mensagens
  msgItem:    { flexDirection: 'row', gap: 6, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,255,0.06)', alignItems: 'flex-start' },
  msgTime:    { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, width: 72, flexShrink: 0, marginTop: 1 },
  msgDirBadge:{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 1, flexShrink: 0 },
  msgRX:      { backgroundColor: 'rgba(0,200,255,0.1)' },
  msgTX:      { backgroundColor: 'rgba(0,255,136,0.1)' },
  msgDirTxt:  { fontFamily: 'ShareTechMono', fontSize: 9, letterSpacing: 0.5 },
  msgTxt:     { fontFamily: 'ShareTechMono', fontSize: 10, color: '#c8e8ff', flex: 1, lineHeight: 15 },
  msgStatus:  { fontFamily: 'ShareTechMono', fontSize: 9, width: 52, textAlign: 'right', flexShrink: 0 },

  // Formulário
  composeRow:       { flexDirection: 'row', gap: 6, marginTop: 10 },
  composeInput:     { flex: 1, backgroundColor: 'rgba(0,200,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.25)', borderRadius: 2, color: C.text, fontFamily: 'ShareTechMono', fontSize: 11, paddingHorizontal: 10, paddingVertical: 6 },
  composeInputError:{ borderColor: C.r, backgroundColor: 'rgba(255,59,59,0.05)' },
  sendBtn:          { backgroundColor: 'rgba(0,200,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,200,255,0.4)', borderRadius: 2, paddingHorizontal: 14, justifyContent: 'center' },
  sendBtnTxt:       { fontFamily: 'ShareTechMono', fontSize: 10, color: C.b, letterSpacing: 1 },
  errorTxt:         { fontFamily: 'ShareTechMono', fontSize: 10, color: C.r, marginTop: 4 },
  latencyNote:      { fontFamily: 'ShareTechMono', fontSize: 9, color: C.muted, marginTop: 6 },
});