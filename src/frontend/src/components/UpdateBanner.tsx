import type { UpdateState } from '../hooks/useUpdater'

interface Props {
  state: UpdateState
}

export default function UpdateBanner({ state }: Props) {
  if (state.status !== 'available' && state.status !== 'installing') return null

  return (
    <div className="bg-emerald-900/50 border-b border-emerald-700 px-6 py-2 flex items-center justify-between">
      <span className="text-sm text-emerald-300">
        {state.status === 'installing'
          ? 'Update wird installiert…'
          : `Neue Version ${state.version} verfügbar`}
      </span>
      {state.status === 'available' && (
        <button
          onClick={state.install}
          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
        >
          Jetzt aktualisieren
        </button>
      )}
    </div>
  )
}
