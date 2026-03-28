import { useAppVersion } from '../hooks/useAppVersion'

interface Props {
  onClose: () => void
}

export default function AboutDialog({ onClose }: Props) {
  const version = useAppVersion()

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-96 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <img src="/quark-frog.svg" alt="Quark" className="w-12 h-12" />
          <div>
            <h2 className="text-xl font-semibold text-white">Quark</h2>
            <p className="text-xs text-gray-500">QR-Code-Generator v{version}</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Kostenloser, werbefreier QR-Code-Generator als Desktop-App für Linux und Windows.
          Keine Cloud, kein Tracking, keine versteckten Kosten.
        </p>

        <div className="border-t border-gray-800 pt-4 flex flex-col gap-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Lizenz</span>
            <span className="text-gray-300">AGPLv3</span>
          </div>
          <div className="flex justify-between">
            <span>Quellcode</span>
            <span className="text-emerald-400">github.com/nicolettas-muggelbude/quark</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer"
        >
          Schließen
        </button>
      </div>
    </div>
  )
}
