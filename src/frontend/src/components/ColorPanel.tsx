import type { QrOptions } from '../types'
import ColorPicker from './ColorPicker'
import CollapsibleCard from './CollapsibleCard'

interface Props {
  options: QrOptions
  onChange: (opts: QrOptions) => void
}

export default function ColorPanel({ options, onChange }: Props) {
  return (
    <CollapsibleCard title="Farben">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Punkte</span>
          <ColorPicker
            color={options.dotColor}
            onChange={dotColor => onChange({ ...options, dotColor })}
            disabled={options.rainbow}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Hintergrund</span>
          <ColorPicker
            color={options.bgColor}
            onChange={bgColor => onChange({ ...options, bgColor })}
          />
        </div>
      </div>
      <button
        onClick={() => onChange({ ...options, rainbow: !options.rainbow })}
        style={
          options.rainbow
            ? { background: 'linear-gradient(to right, #ff0000, #ff8800, #ffff00, #00cc00, #0000ff, #8800ff)' }
            : undefined
        }
        className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          options.rainbow
            ? 'text-white shadow-md'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        Regenbogen
      </button>
    </CollapsibleCard>
  )
}
