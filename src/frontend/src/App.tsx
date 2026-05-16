import QrPreview from './components/QrPreview'
import UrlInput from './components/UrlInput'
import ExportPanel from './components/ExportPanel'
import ColorPanel from './components/ColorPanel'
import LabelPanel from './components/LabelPanel'
import FramePanel from './components/FramePanel'
import AboutDialog from './components/AboutDialog'
import UpdateBanner from './components/UpdateBanner'
import { useUpdater } from './hooks/useUpdater'
import { useAppVersion } from './hooks/useAppVersion'
import { useState } from 'react'
import { DEFAULT_QR_OPTIONS, type QrOptions } from './types'

export default function App() {
  const [url, setUrl] = useState('')
  const [showAbout, setShowAbout] = useState(false)
  const [qrOptions, setQrOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS)
  const updateState = useUpdater()
  const version = useAppVersion()

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
        <img src="/quark-frog.svg" alt="Quark" className="w-8 h-8 select-none" />
        <span className="text-xl font-semibold tracking-tight text-white">Quark</span>
        <span className="text-xs text-gray-500 ml-1 mt-1">QR-Generator</span>
        <div className="ml-auto">
          <button
            onClick={() => setShowAbout(true)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            Info
          </button>
        </div>
      </header>

      <UpdateBanner state={updateState} />

      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}

      {/* Main */}
      <main className="flex flex-1 gap-6 p-10 pt-8 overflow-hidden">
        {/* Linke Spalte: Einstellungen */}
        <div
          className="flex flex-col gap-4 w-80 shrink-0 overflow-y-auto pr-1"
          onWheel={e => { e.currentTarget.scrollTop += e.deltaY }}
        >
          <UrlInput url={url} onChange={setUrl} />
          <ColorPanel options={qrOptions} onChange={setQrOptions} />
          <LabelPanel options={qrOptions} onChange={setQrOptions} />
          <FramePanel options={qrOptions} onChange={setQrOptions} />
          <ExportPanel url={url} disabled={!url || !isValidUrl(url)} qrOptions={qrOptions} />
        </div>

        {/* Rechte Spalte: Vorschau */}
        <div className="flex flex-1 items-center justify-center">
          <QrPreview url={url} qrOptions={qrOptions} />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-700 py-3 border-t border-gray-900">
        Quark v{version} — AGPLv3
      </footer>
    </div>
  )
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
