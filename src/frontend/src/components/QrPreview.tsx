import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { autoLabelFontSize, buildQrConfig, LABEL_FONT_CSS, type QrOptions } from '../types'

interface Props {
  url: string
  qrOptions: QrOptions
}

const QR_PX = 300

export default function QrPreview({ url, qrOptions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: QR_PX,
        height: QR_PX,
        type: 'svg',
        qrOptions: { errorCorrectionLevel: 'M' },
        ...buildQrConfig(qrOptions),
      })
      if (containerRef.current) {
        qrRef.current.append(containerRef.current)
      }
    }
    qrRef.current.update({
      data: url || 'https://example.com',
      ...buildQrConfig(qrOptions),
    })
  }, [url, qrOptions])

  const fontSize = autoLabelFontSize(qrOptions.label, QR_PX)

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-200 ${
          url ? 'opacity-100' : 'opacity-30'
        }`}
        style={{ backgroundColor: qrOptions.bgColor }}
      >
        <div ref={containerRef} />
        {qrOptions.label && (
          <div
            className="font-semibold px-4 pb-3 pt-1 leading-snug"
            style={{
              color:      qrOptions.labelColor,
              backgroundColor: qrOptions.bgColor,
              fontFamily: LABEL_FONT_CSS[qrOptions.labelFont],
              fontSize:   `${fontSize}px`,
              textAlign:  qrOptions.labelAlign,
            }}
          >
            {qrOptions.label}
          </div>
        )}
      </div>
      {!url && (
        <p className="text-sm text-gray-500">URL eingeben um QR-Code zu generieren</p>
      )}
    </div>
  )
}
