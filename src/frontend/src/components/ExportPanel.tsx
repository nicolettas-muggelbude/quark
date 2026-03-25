import { useState } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface Props {
  url: string
  disabled: boolean
}

const SIZES = [256, 512, 1024] as const

export default function ExportPanel({ url, disabled }: Props) {
  const [size, setSize] = useState<(typeof SIZES)[number]>(512)

  async function handleExport() {
    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'canvas',
      data: url,
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
      qrOptions: { errorCorrectionLevel: 'M' },
    })
    await qr.download({ name: 'quark-qr', extension: 'png' })
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-300">Export</p>

      {/* Größenauswahl */}
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

      {/* Export-Button */}
      <button
        onClick={handleExport}
        disabled={disabled}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        PNG exportieren
      </button>
    </div>
  )
}
