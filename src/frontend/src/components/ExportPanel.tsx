import { useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { downloadDir, homeDir, join } from '@tauri-apps/api/path'
import { error as logError, info as logInfo } from '@tauri-apps/plugin-log'
import { buildQrConfig, type QrOptions } from '../types'

interface Props {
  url: string
  disabled: boolean
  qrOptions: QrOptions
}

const SIZES = [256, 512, 1024] as const

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

      const blob = await qr.getRawData('png')
      if (!blob) throw new Error('QR-Daten konnten nicht generiert werden')

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
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-300">Export</p>

      <div>
        <p className="text-xs text-gray-500 mb-2">Größe (px)</p>
        <div className="flex gap-2">
          {SIZES.map((s) => (
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
        <p className="text-xs text-emerald-400 break-all">
          Gespeichert nach {savedPath}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 break-all">{error}</p>
      )}
    </div>
  )
}
