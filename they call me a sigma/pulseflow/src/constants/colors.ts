export const colors = {
  background: {
    deep:     '#0A0A0A',
    card:     '#111111',
    elevated: '#1A1A1A',
  },
  accent: {
    primary: '#00E676',
    warning: '#FF8F00',
    danger:  '#E53935',
  },
  text: {
    primary:   '#F5F5F5',
    secondary: '#9E9E9E',
  },
  soreness: {
    low:  '#00E676',
    mid:  '#FF8F00',
    high: '#E53935',
  },
  border: '#1A1A1A',
} as const;

export function sorenessColor(score: number): string {
  if (score <= 3) return colors.soreness.low;
  if (score <= 6) return colors.soreness.mid;
  return colors.soreness.high;
}

export function recoveryColor(score: number): string {
  if (score >= 75) return colors.soreness.low;
  if (score >= 50) return colors.soreness.mid;
  return colors.soreness.high;
}
