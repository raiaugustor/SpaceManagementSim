export const Colors = {
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

export const Fonts = {
  mono:         'ShareTechMono',
  orbitron:     'Orbitron-Regular',
  orbitronSemi: 'Orbitron-SemiBold',
  orbitronBold: 'Orbitron-Bold',
};

export const statusColor = {
  ok:   '#00ff88',
  warn: '#ffb300',
  crit: '#ff3b3b',
};

export function percentColor(pct: number): string {
  if (pct <= 20) return '#ff3b3b';
  if (pct <= 50) return '#ffb300';
  return '#00ff88';
}
