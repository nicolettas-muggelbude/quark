import { useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { downloadDir, homeDir, join } from '@tauri-apps/api/path'
import { error as logError, info as logInfo } from '@tauri-apps/plugin-log'
import { buildQrConfig, LABEL_FONT_CSS, type QrOptions } from '../types'
import CollapsibleCard from './CollapsibleCard'

interface Props {
  url: string
  disabled: boolean
  qrOptions: QrOptions
}

const SIZES = [256, 512, 1024] as const

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontBase: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): number {
  let size = maxSize
  while (size > minSize) {
    ctx.font = `600 ${size}px ${fontBase}`
    if (ctx.measureText(text).width <= maxWidth) break
    size--
  }
  return size
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  if (r > 0 && 'roundRect' in ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ctx as any).roundRect(x, y, w, h, r)
  } else {
    ctx.rect(x, y, w, h)
  }
}

export default function ExportPanel({ url, disabled, qrOptions }: Props) {
  const [size, setSize] = useState<(typeof SIZES)[number]>(512)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [lastDir, setLastDir] = useState<string | null>(null)

  async function handleExport() {
    if (disabled) return
    setExporting(true)
    setError(null)
    setSavedPath(null)
    try {
      const { frame } = qrOptions
      const hasFrame    = frame.style !== 'none'
      const isBadgeTop  = frame.style === 'badge-top'
      const isBadgeBtm  = frame.style === 'badge-bottom'
      const isBadge     = isBadgeTop || isBadgeBtm
      const isCorner    = frame.style === 'corners'
      const isSimple    = frame.style === 'simple'

      // Vorschau-Rohwerte (bei 300px QR)
      const fw_raw  = hasFrame ? (frame.width + 1) : 0
      const gap_raw = hasFrame ? (frame.innerPad === 'klein' ? 15 : 16) : 0

      // Gesamtbreite der Vorschau — davon leitet sich der Skalierungsfaktor ab
      // Canvas = immer exakt `size` px, alles wird proportional skaliert
      const totalW_prev = !hasFrame ? 300
                        : isCorner  ? 300 + 2 * gap_raw
                        :             300 + 2 * (fw_raw + gap_raw)
      const scale = size / totalW_prev

      const qrW         = Math.round(300 * scale)
      const fw          = Math.round(fw_raw  * scale)
      const gap         = Math.round(gap_raw * scale)
      const cornerSize  = isCorner ? Math.round(300 * 0.22 * scale) : 0
      const badgeH      = isBadge  ? Math.round(36 * scale) : 0
      const frameRadius = (isSimple || isBadge || isCorner)
                        ? Math.round(frame.radius * 300 / 200 * scale) : 0

      const qr = new QRCodeStyling({
        width: qrW, height: qrW, type: 'canvas', data: url,
        qrOptions: { errorCorrectionLevel: 'M' },
        ...buildQrConfig(qrOptions),
      })
      const qrBlob = await qr.getRawData('png')
      if (!qrBlob) throw new Error('QR-Daten konnten nicht generiert werden')

      const fontCSS  = LABEL_FONT_CSS[qrOptions.labelFont]
      const paddingV = Math.round(qrW * 0.035)

      const probe    = document.createElement('canvas')
      const probeCtx = probe.getContext('2d')!
      let labelH = 0, labelFontSz = 0
      if (qrOptions.label) {
        labelFontSz = fitFontSize(probeCtx, qrOptions.label, fontCSS,
          qrW - 32, Math.round(qrW * 0.09), Math.round(qrW * 0.025))
        labelH = labelFontSz + paddingV * 2
      }

      // Canvas-Breite ist immer exakt `size` px (qrW + Rahmen = size per Konstruktion)
      // Canvas-Höhe wächst nur für Label und Badge
      let canvasW: number, canvasH: number, qrX: number, qrY: number
      if (!hasFrame) {
        canvasW = size;  canvasH = size + labelH;
        qrX = 0;         qrY = 0
      } else if (isSimple) {
        canvasW = size;  canvasH = size + labelH;
        qrX = fw + gap;  qrY = fw + gap
      } else if (isCorner) {
        canvasW = size;  canvasH = size + labelH;
        qrX = gap;       qrY = gap
      } else if (isBadgeTop) {
        canvasW = size;  canvasH = size + badgeH + labelH;
        qrX = fw + gap;  qrY = fw + badgeH + gap
      } else { // badge-bottom
        canvasW = size;  canvasH = size + badgeH + labelH;
        qrX = fw + gap;  qrY = fw + gap
      }

      const qrImg = new Image()
      const objUrl = URL.createObjectURL(qrBlob as Blob)
      await new Promise<void>(r => { qrImg.onload = () => r(); qrImg.src = objUrl })
      URL.revokeObjectURL(objUrl)

      const canvas = document.createElement('canvas')
      canvas.width  = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')!

      // --- Hintergrund und Rahmen zeichnen ---

      if (!hasFrame) {
        ctx.fillStyle = qrOptions.bgColor
        ctx.fillRect(0, 0, canvasW, canvasH)

      } else if (isSimple) {
        // bgColor füllt die gesamte Fläche inkl. hinter dem Rahmen (identisch zu CSS background-color)
        ctx.fillStyle = qrOptions.bgColor
        drawRoundRect(ctx, 0, 0, canvasW, canvasH, frameRadius)
        ctx.fill()

      } else if (isCorner) {
        ctx.fillStyle = qrOptions.bgColor
        ctx.fillRect(0, 0, canvasW, canvasH)

      } else if (isBadge) {
        // Clip auf äußeren border-radius (identisch zum CSS overflow:hidden in der Vorschau)
        ctx.save()
        drawRoundRect(ctx, fw * 0.5, fw * 0.5, canvasW - fw, canvasH - fw, frameRadius)
        ctx.clip()
        // Gesamte Innenfläche mit frame.color (Badge-Farbe) füllen
        ctx.fillStyle = frame.color
        ctx.fillRect(0, 0, canvasW, canvasH)
        // QR+Label-Bereich mit bgColor überfüllen
        const bgY = isBadgeTop ? fw + badgeH : fw
        const bgH = canvasH - 2*fw - badgeH
        ctx.fillStyle = qrOptions.bgColor
        ctx.fillRect(fw, bgY, canvasW - 2*fw, bgH)
        ctx.restore()
      }

      // QR zeichnen
      ctx.drawImage(qrImg, qrX, qrY)

      // Label zeichnen
      if (qrOptions.label && labelFontSz > 0) {
        ctx.fillStyle    = qrOptions.labelColor
        ctx.font         = `600 ${labelFontSz}px ${fontCSS}`
        ctx.textAlign    = qrOptions.labelAlign
        ctx.textBaseline = 'middle'
        const textX = qrOptions.labelAlign === 'left'  ? qrX + 16
                    : qrOptions.labelAlign === 'right' ? qrX + qrW - 16
                    : qrX + qrW / 2
        ctx.fillText(qrOptions.label, textX, qrY + qrW + paddingV + labelFontSz / 2)
      }

      // Badge-Text zeichnen
      if (isBadge && frame.text) {
        const innerW  = canvasW - 2*fw
        const badgeY  = isBadgeTop ? fw : canvasH - fw - badgeH
        const maxBadgeSz  = Math.round(badgeH * 0.5)
        const minBadgeSz  = Math.round(badgeH * 0.2)
        const badgeFontSz = fitFontSize(ctx, frame.text, 'system-ui, sans-serif',
          innerW - 32, maxBadgeSz, minBadgeSz)
        ctx.fillStyle    = frame.textColor
        ctx.font         = `600 ${badgeFontSz}px system-ui, sans-serif`
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(frame.text, fw + innerW / 2, badgeY + badgeH / 2)
      }

      // Rahmen-Linie zeichnen (simple + badge)
      if (isSimple || isBadge) {
        ctx.strokeStyle = frame.color
        ctx.lineWidth   = fw
        drawRoundRect(ctx, fw / 2, fw / 2, canvasW - fw, canvasH - fw, frameRadius)
        ctx.stroke()
      }

      // Ecken-Klammern zeichnen
      if (isCorner) {
        ctx.strokeStyle = frame.color
        ctx.lineWidth   = fw
        const h  = fw / 2
        const cs = cornerSize
        const W  = canvasW
        const H  = canvasH - labelH  // Ecken umrahmen nur den QR+gap-Bereich

        if (frameRadius > 0) {
          const r = frameRadius
          ctx.lineCap  = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath(); ctx.moveTo(cs, h); ctx.lineTo(h + r, h)
          ctx.arc(h + r, h + r, r, -Math.PI / 2, Math.PI, true)
          ctx.lineTo(h, cs); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(W - cs, h); ctx.lineTo(W - h - r, h)
          ctx.arc(W - h - r, h + r, r, -Math.PI / 2, 0, false)
          ctx.lineTo(W - h, cs); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(cs, H - h); ctx.lineTo(h + r, H - h)
          ctx.arc(h + r, H - h - r, r, Math.PI / 2, Math.PI, false)
          ctx.lineTo(h, H - cs); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(W - cs, H - h); ctx.lineTo(W - h - r, H - h)
          ctx.arc(W - h - r, H - h - r, r, Math.PI / 2, 0, true)
          ctx.lineTo(W - h, H - cs); ctx.stroke()
        } else {
          ctx.lineCap  = 'square'
          ctx.lineJoin = 'miter'
          const L = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke()
          }
          L(cs, h,     h,     h,     h,     cs)
          L(W-cs, h,   W-h,   h,     W-h,   cs)
          L(cs, H-h,   h,     H-h,   h,     H-cs)
          L(W-cs, H-h, W-h,   H-h,   W-h,   H-cs)
        }
      }

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
      if (!blob) throw new Error('Export fehlgeschlagen')

      let baseDir: string
      try { baseDir = lastDir ?? await downloadDir() }
      catch { baseDir = lastDir ?? await homeDir() }
      const defaultPath = await join(baseDir, 'quark-qr.png')

      let path: string | null = null
      let fallback = false
      try {
        path = await save({ defaultPath, filters: [{ name: 'PNG', extensions: ['png'] }] })
      } catch (dialogErr) {
        const msg = dialogErr instanceof Error ? dialogErr.message : String(dialogErr)
        logError(`[Export] Dialog-Fehler: ${msg}`)
        path = defaultPath
        fallback = true
      }

      if (!path) return
      const buffer = await blob.arrayBuffer()
      await writeFile(path, new Uint8Array(buffer))
      logInfo(`[Export] Gespeichert: ${path}`)

      if (fallback) {
        setSavedPath(path)
      } else {
        const parts = path.replace(/\\/g, '/').split('/')
        parts.pop()
        setLastDir(parts.join('/') || '/')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      logError(`[Export] Fehler: ${msg}`)
      setError(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <CollapsibleCard title="Export" defaultOpen>
      <div>
        <p className="text-xs text-gray-500 mb-2">Größe (px)</p>
        <div className="flex gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                size === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        {exporting ? 'Exportiere…' : 'PNG exportieren'}
      </button>

      {savedPath && (
        <p className="text-xs text-emerald-400 break-all">Gespeichert nach {savedPath}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 break-all">{error}</p>
      )}
    </CollapsibleCard>
  )
}
