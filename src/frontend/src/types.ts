import type { Options } from 'qr-code-styling'

export interface QrOptions {
  dotColor: string
  bgColor: string
  rainbow: boolean
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  dotColor: '#000000',
  bgColor: '#ffffff',
  rainbow: false,
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
