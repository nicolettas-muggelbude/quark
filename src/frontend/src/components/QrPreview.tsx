import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface Props {
  url: string
}

export default function QrPreview({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: 300,
        height: 300,
        type: 'svg',
        dotsOptions: { color: '#000000', type: 'square' },
        backgroundOptions: { color: '#ffffff' },
        qrOptions: { errorCorrectionLevel: 'M' },
      })
      if (containerRef.current) {
        qrRef.current.append(containerRef.current)
      }
    }
    qrRef.current.update({ data: url || 'https://example.com' })
  }, [url])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-200 ${
          url ? 'opacity-100' : 'opacity-30'
        }`}
      >
        <div ref={containerRef} />
      </div>
      {!url && (
        <p className="text-sm text-gray-500">URL eingeben um QR-Code zu generieren</p>
      )}
    </div>
  )
}
