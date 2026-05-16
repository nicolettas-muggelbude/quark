import type { FrameOptions, FrameStyle, InnerPad, QrOptions } from '../types'
import ColorPicker from './ColorPicker'
import CollapsibleCard from './CollapsibleCard'

interface Props {
  options: QrOptions
  onChange: (opts: QrOptions) => void
}

const STYLES: { value: FrameStyle; label: string; title: string }[] = [
  { value: 'none',         label: 'Kein',   title: 'Kein Rahmen'    },
  { value: 'simple',       label: 'Rand',   title: 'Einfacher Rand' },
  { value: 'corners',      label: 'Ecken',  title: 'Ecken'          },
  { value: 'badge-top',    label: 'Text ↑', title: 'Badge oben'     },
  { value: 'badge-bottom', label: 'Text ↓', title: 'Badge unten'    },
]

export default function FramePanel({ options, onChange }: Props) {
  const { frame } = options
  const hasFrame  = frame.style !== 'none'
  const isBadge   = frame.style === 'badge-top' || frame.style === 'badge-bottom'
  const hasRadius = frame.style === 'simple' || isBadge || frame.style === 'corners'

  const set = (patch: Partial<FrameOptions>) =>
    onChange({ ...options, frame: { ...frame, ...patch } })

  return (
    <CollapsibleCard title="Rahmen">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Stil</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLES.map(s => (
            <button
              key={s.value}
              onClick={() => set({ style: s.value })}
              title={s.title}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                s.value === frame.style
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {hasFrame && (
        <>
          <div className="flex items-center gap-3">
            <ColorPicker color={frame.color} onChange={color => set({ color })} />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Stärke</p>
              <input
                type="range" min={1} max={10} value={frame.width}
                onChange={e => set({ width: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Abstand</p>
            <div className="flex gap-1.5">
              {(['klein', 'gross'] as InnerPad[]).map(p => (
                <button
                  key={p}
                  onClick={() => set({ innerPad: p })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    frame.innerPad === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {p === 'klein' ? 'Eng' : 'Weit'}
                </button>
              ))}
            </div>
          </div>

          {hasRadius && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Eckenradius</p>
              <input
                type="range" min={0} max={20} value={frame.radius}
                onChange={e => set({ radius: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          )}

          {isBadge && (
            <>
              <input
                type="text"
                value={frame.text}
                onChange={e => set({ text: e.target.value })}
                placeholder="Badge-Text"
                maxLength={40}
                className="w-full bg-gray-800 text-gray-100 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-emerald-500 placeholder-gray-600"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Textfarbe</span>
                <ColorPicker color={frame.textColor} onChange={textColor => set({ textColor })} />
              </div>
            </>
          )}
        </>
      )}
    </CollapsibleCard>
  )
}
