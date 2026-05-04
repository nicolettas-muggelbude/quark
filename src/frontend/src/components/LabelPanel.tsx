import type { LabelAlign, LabelFont, QrOptions } from '../types'
import ColorPicker from './ColorPicker'
import CollapsibleCard from './CollapsibleCard'

interface Props {
  options: QrOptions
  onChange: (opts: QrOptions) => void
}

const FONTS: { value: LabelFont; label: string; style: string }[] = [
  { value: 'sans',  label: 'Sans',  style: 'system-ui, sans-serif'   },
  { value: 'serif', label: 'Serif', style: 'Georgia, serif'          },
  { value: 'mono',  label: 'Mono',  style: 'ui-monospace, monospace' },
]

const ALIGNS: { value: LabelAlign; icon: string }[] = [
  { value: 'left',   icon: '⬅' },
  { value: 'center', icon: '↔' },
  { value: 'right',  icon: '➡' },
]

function SegButton<T extends string>({
  value, current, onChange, children, style,
}: {
  value: T; current: T; onChange: (v: T) => void
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <button
      onClick={() => onChange(value)}
      style={style}
      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        value === current
          ? 'bg-emerald-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export default function LabelPanel({ options, onChange }: Props) {
  const hasLabel = options.label.length > 0

  return (
    <CollapsibleCard title="Beschriftung">
      <input
        type="text"
        value={options.label}
        onChange={e => onChange({ ...options, label: e.target.value })}
        placeholder="Text unter dem QR-Code"
        maxLength={80}
        className="w-full bg-gray-800 text-gray-100 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-emerald-500 placeholder-gray-600"
      />

      {hasLabel && (
        <>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Schrift</p>
            <div className="flex gap-2">
              {FONTS.map(f => (
                <SegButton key={f.value} value={f.value} current={options.labelFont}
                  onChange={v => onChange({ ...options, labelFont: v })}
                  style={{ fontFamily: f.style }}>
                  {f.label}
                </SegButton>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 flex-1">
              {ALIGNS.map(a => (
                <SegButton key={a.value} value={a.value} current={options.labelAlign}
                  onChange={v => onChange({ ...options, labelAlign: v })}>
                  {a.icon}
                </SegButton>
              ))}
            </div>
            <ColorPicker
              color={options.labelColor}
              onChange={labelColor => onChange({ ...options, labelColor })}
            />
          </div>
        </>
      )}
    </CollapsibleCard>
  )
}
