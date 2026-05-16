import type { Options } from 'qr-code-styling'

export type LabelFont  = 'sans' | 'serif' | 'mono'
export type LabelAlign = 'left' | 'center' | 'right'
export type FrameStyle = 'none' | 'simple' | 'corners' | 'badge-top' | 'badge-bottom'

export type InnerPad = 'klein' | 'gross'

export interface FrameOptions {
  style: FrameStyle
  color: string
  width: number     // 1–10
  radius: number    // 0–20, Eckenradius für simple/badge
  text: string      // Badge-Text
  textColor: string
  innerPad: InnerPad
}

export const DEFAULT_FRAME_OPTIONS: FrameOptions = {
  style: 'none',
  color: '#10b981',
  width: 5,
  radius: 5,
  text: 'Scan Me',
  textColor: '#ffffff',
  innerPad: 'gross',
}

export interface QrOptions {
  dotColor: string
  bgColor: string
  rainbow: boolean
  label: string
  labelColor: string
  labelFont: LabelFont
  labelAlign: LabelAlign
  frame: FrameOptions
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  dotColor: '#000000',
  bgColor: '#ffffff',
  rainbow: false,
  label: '',
  labelColor: '#000000',
  labelFont: 'sans',
  labelAlign: 'center',
  frame: DEFAULT_FRAME_OPTIONS,
}

export const LABEL_FONT_CSS: Record<LabelFont, string> = {
  sans:  'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono:  'ui-monospace, monospace',
}

/** Schriftgröße (px) automatisch berechnen: passt Text in availableWidth. */
export function autoLabelFontSize(
  text: string,
  qrPx: number,
  paddingPx = 16,
): number {
  if (!text) return 0
  const available = qrPx - paddingPx * 2
  // Durschnittliche Zeichenbreite ≈ 55 % der Schriftgröße
  const raw = available / (text.length * 0.55)
  return Math.round(Math.min(Math.max(raw, qrPx * 0.025), qrPx * 0.09))
}

const RAINBOW_STOPS = [
  { offset: 0,    color: '#ff0000' },
  { offset: 0.17, color: '#ff8800' },
  { offset: 0.33, color: '#ffff00' },
  { offset: 0.5,  color: '#00cc00' },
  { offset: 0.67, color: '#0000ff' },
  { offset: 0.83, color: '#8800ff' },
  { offset: 1,    color: '#ff0000' },
]

export function buildQrConfig(opts: QrOptions): Pick<Options, 'dotsOptions' | 'backgroundOptions'> {
  return {
    dotsOptions: opts.rainbow
      ? { type: 'square', color: undefined, gradient: { type: 'linear', rotation: Math.PI / 2, colorStops: RAINBOW_STOPS } }
      : { type: 'square', color: opts.dotColor, gradient: undefined },
    backgroundOptions: { color: opts.bgColor },
  }
}
