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

  const { frame } = qrOptions
  const hasFrame      = frame.style !== 'none'
  const isBadgeTop    = frame.style === 'badge-top'
  const isBadgeBottom = frame.style === 'badge-bottom'
  const isBadge       = isBadgeTop || isBadgeBottom
  const isCorner      = frame.style === 'corners'

  // Fester Abstand zwischen QR und Rahmen/Ecken — ändert sich nicht mit Radius
  const gap         = frame.innerPad === 'klein' ? 10 : 24
  const fw          = frame.width + 1
  const cornerSize  = Math.round(QR_PX * 0.22)
  const frameRadius = Math.round(frame.radius * QR_PX / 200)
  const badgeH      = 36
  const badgeFontSz = Math.round(badgeH * 0.4)

  useEffect(() => {
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: QR_PX, height: QR_PX, type: 'svg',
        qrOptions: { errorCorrectionLevel: 'M' },
        ...buildQrConfig(qrOptions),
      })
    }
    if (containerRef.current && !containerRef.current.hasChildNodes()) {
      qrRef.current.append(containerRef.current)
    }
    qrRef.current.update({
      width: QR_PX, height: QR_PX,
      data: url || 'https://example.com',
      ...buildQrConfig(qrOptions),
    })
  }, [url, qrOptions])

  const fontSize = autoLabelFontSize(qrOptions.label, QR_PX)

  const labelEl = qrOptions.label ? (
    <div
      className="font-semibold px-4 pb-3 pt-1 leading-snug"
      style={{
        color:           qrOptions.labelColor,
        backgroundColor: qrOptions.bgColor,
        fontFamily:      LABEL_FONT_CSS[qrOptions.labelFont],
        fontSize:        `${fontSize}px`,
        textAlign:       qrOptions.labelAlign,
      }}
    >
      {qrOptions.label}
    </div>
  ) : null

  const badgeEl = (
    <div
      className="flex items-center justify-center font-semibold tracking-wider"
      style={{
        backgroundColor: frame.color,
        color:           frame.textColor,
        height:          `${badgeH}px`,
        fontSize:        `${badgeFontSz}px`,
      }}
    >
      {frame.text || ' '}
    </div>
  )

  let content: React.ReactNode

  if (!hasFrame) {
    content = (
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: qrOptions.bgColor }}
      >
        <div ref={containerRef} />
        {labelEl}
      </div>
    )
  } else if (isCorner) {
    // Ecken-Klammern sitzen am Rand des bgColor-Bereichs (gap = Abstand zum QR)
    const base: React.CSSProperties = {
      position:    'absolute',
      width:       cornerSize,
      height:      cornerSize,
      borderColor: frame.color,
      borderStyle: 'solid',
    }
    const cr = frameRadius  // 0 = eckig, >0 = abgerundet
    content = (
      <div className="shadow-2xl" style={{
        position: 'relative', display: 'inline-block',
        padding: `${gap}px`, backgroundColor: qrOptions.bgColor,
      }}>
        <div>
          <div ref={containerRef} />
          {labelEl}
        </div>
        <div style={{ ...base, top: 0, left: 0,
          borderWidth: `${fw}px 0 0 ${fw}px`, borderTopLeftRadius: cr }} />
        <div style={{ ...base, top: 0, right: 0,
          borderWidth: `${fw}px ${fw}px 0 0`, borderTopRightRadius: cr }} />
        <div style={{ ...base, bottom: 0, left: 0,
          borderWidth: `0 0 ${fw}px ${fw}px`, borderBottomLeftRadius: cr }} />
        <div style={{ ...base, bottom: 0, right: 0,
          borderWidth: `0 ${fw}px ${fw}px 0`, borderBottomRightRadius: cr }} />
      </div>
    )
  } else if (isBadge) {
    // Badge: Rahmen mit overflow:hidden, bgColor-Bereich mit gap-Abstand
    content = (
      <div
        className="shadow-2xl"
        style={{
          border:          `${fw}px solid ${frame.color}`,
          borderRadius:    `${frameRadius}px`,
          overflow:        'hidden',
          backgroundColor: frame.color,
        }}
      >
        {isBadgeTop && badgeEl}
        <div style={{ backgroundColor: qrOptions.bgColor, padding: `${gap}px` }}>
          <div ref={containerRef} />
          {labelEl}
        </div>
        {isBadgeBottom && badgeEl}
      </div>
    )
  } else {
    // Simple: kein overflow:hidden — bgColor füllt den Innenbereich, Rahmen liegt außen
    // CSS clippt die Hintergrundfarbe automatisch am border-radius, der QR-Inhalt wird nicht beschnitten
    content = (
      <div
        className="shadow-2xl"
        style={{
          border:          `${fw}px solid ${frame.color}`,
          borderRadius:    `${frameRadius}px`,
          padding:         `${gap}px`,
          backgroundColor: qrOptions.bgColor,
        }}
      >
        <div ref={containerRef} />
        {labelEl}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`transition-opacity duration-200 ${url ? 'opacity-100' : 'opacity-30'}`}>
        {content}
      </div>
      {!url && (
        <p className="text-sm text-gray-500">URL eingeben um QR-Code zu generieren</p>
      )}
    </div>
  )
}
