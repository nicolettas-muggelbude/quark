import { useState, useRef, useEffect } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface Props {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
}

export default function ColorPicker({ color, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [alignLeft, setAlignLeft] = useState(false)
  const [alignTop, setAlignTop] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setAlignLeft(rect.left < window.innerWidth / 2)
      setAlignTop(rect.top > window.innerHeight / 2)
    }
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        disabled={disabled}
        style={{ backgroundColor: color }}
        className={`w-8 h-8 rounded border border-gray-600 transition-opacity ${
          disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:ring-2 ring-emerald-500 ring-offset-1 ring-offset-gray-900'
        }`}
      />
      {open && (
        <div className={`absolute z-50 bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-2xl flex flex-col gap-2 ${alignLeft ? 'left-0' : 'right-0'} ${alignTop ? 'bottom-10' : 'top-10'}`}>
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg border border-gray-700 px-2 py-1">
            <span className="text-xs text-gray-500 select-none">#</span>
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed={false}
              className="flex-1 bg-transparent text-gray-200 text-xs font-mono outline-none uppercase w-16"
            />
          </div>
        </div>
      )}
    </div>
  )
}
