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

/** Passt die Schriftgröße per measureText an die verfügbare Breite an. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, fontBase: string, qrPx: number): number {
  const maxWidth = qrPx - 32
  const maxSize = Math.round(qrPx * 0.09)
  const minSize = Math.round(qrPx * 0.025)
  let size = maxSize
  while (size > minSize) {
    ctx.font = `600 ${size}px ${fontBase}`
    if (ctx.measureText(text).width <= maxWidth) break
    size--
  }
  return size
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
      const qr = new QRCodeStyling({
        width: size,
        height: size,
        type: 'canvas',
        data: url,
        qrOptions: { errorCorrectionLevel: 'M' },
        ...buildQrConfig(qrOptions),
      })

      let blob = await qr.getRawData('png')
      if (!blob) throw new Error('QR-Daten konnten nicht generiert werden')

      if (qrOptions.label) {
        const fontCSS = LABEL_FONT_CSS[qrOptions.labelFont]
        const paddingV = Math.round(size * 0.035)

        // Probe-Canvas nur für measureText
        const probe = document.createElement('canvas')
        const probeCtx = probe.getContext('2d')!
        const fontSize = fitFontSize(probeCtx, qrOptions.label, fontCSS, size)
        const labelHeight = fontSize + paddingV * 2

        const img = new Image()
        const objectUrl = URL.createObjectURL(blob as Blob)
        await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = objectUrl })
        URL.revokeObjectURL(objectUrl)

        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size + labelHeight
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = qrOptions.bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        ctx.fillStyle = qrOptions.labelColor
        ctx.font = `600 ${fontSize}px ${fontCSS}`
        ctx.textAlign = qrOptions.labelAlign
        ctx.textBaseline = 'middle'
        const x = qrOptions.labelAlign === 'left'  ? 16
                : qrOptions.labelAlign === 'right' ? size - 16
                : size / 2
        ctx.fillText(qrOptions.label, x, size + paddingV + fontSize / 2)

        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('Label-Composite fehlgeschlagen')
      }

      let baseDir: string
      try {
        baseDir = lastDir ?? await downloadDir()
      } catch {
        baseDir = lastDir ?? await homeDir()
      }
      const defaultPath = await join(baseDir, 'quark-qr.png')

      let path: string | null = null
      let fallback = false

      try {
        path = await save({
          defaultPath,
          filters: [{ name: 'PNG', extensions: ['png'] }],
        })
      } catch (dialogErr) {
        const msg = dialogErr instanceof Error ? dialogErr.message : String(dialogErr)
        logError(`[Export] Dialog-Fehler: ${msg}`)
        path = defaultPath
        fallback = true
      }

      if (!path) return

      const buffer = await (blob as Blob).arrayBuffer()
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
