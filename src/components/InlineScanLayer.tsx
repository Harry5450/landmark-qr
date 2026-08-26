import { useEffect, useId, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_QUIET_ZONE_MODULES,
} from '../lib/qr'
import type { LandmarkQrMark } from '../data/landmarks'
import { getLandmarkQrImageSettings } from '../lib/landmarkQrMark'
import { ShareActions } from './ShareActions'

type InlineScanLayerProps = {
  destinationUrl: string
  landmarkName: string
  qrMark?: LandmarkQrMark
  shareUrl: string
  downloadFileName?: string
  onReturn: () => void
  visible: boolean
}

function downloadSvg(svg: SVGSVGElement, fileName: string) {
  const source = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  queueMicrotask(() => URL.revokeObjectURL(objectUrl))
}

/**
 * Canonical QR surface rendered inside the scene frame after the 3D reveal.
 * It is deliberately not a modal: the 3D composition remains the visual context.
 */
export function InlineScanLayer({
  destinationUrl,
  landmarkName,
  qrMark,
  shareUrl,
  downloadFileName = 'landmark-qr.svg',
  onReturn,
  visible,
}: InlineScanLayerProps) {
  const titleId = useId()
  const qrRef = useRef<SVGSVGElement>(null)
  const returnButtonRef = useRef<HTMLButtonElement>(null)
  const onReturnRef = useRef(onReturn)

  onReturnRef.current = onReturn
  const imageSettings = getLandmarkQrImageSettings(qrMark)

  useEffect(() => {
    if (!visible) return

    const previouslyFocused = document.activeElement
    returnButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onReturnRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [visible])

  if (!visible) return null

  const handleDownload = () => {
    if (!qrRef.current) {
      throw new Error('The canonical QR is not available.')
    }

    downloadSvg(qrRef.current, downloadFileName)
  }

  return (
    <section
      className="inline-scan-layer is-visible"
      role="region"
      aria-labelledby={titleId}
      data-testid="inline-scan-layer"
    >
      <div className="inline-scan-layer__content">
        <p className="inline-scan-layer__eyebrow">SCAN-SAFE REVEAL</p>
        <h2 id={titleId}>{landmarkName} has become your QR</h2>

        <button
          ref={returnButtonRef}
          type="button"
          className="inline-scan-layer__qr"
          aria-label="Return to 3D from QR code"
          onClick={onReturn}
        >
          <QRCodeSVG
            ref={qrRef}
            value={destinationUrl}
            size={292}
            level={QR_ERROR_CORRECTION_LEVEL}
            marginSize={QR_QUIET_ZONE_MODULES}
            bgColor="#ffffff"
            fgColor="#0b1020"
            imageSettings={imageSettings}
            title={`QR code for ${destinationUrl}`}
          />
        </button>

        <p className="inline-scan-layer__hint">
          The landmark is embedded in the center while the finder patterns stay
          untouched. Select the QR or press Escape to rebuild it.
        </p>

        <ShareActions
          shareUrl={shareUrl}
          destinationUrl={destinationUrl}
          onDownloadQr={handleDownload}
          onReturn={onReturn}
          shareTitle={`${landmarkName} Landmark QR`}
        />
      </div>
    </section>
  )
}

export type { InlineScanLayerProps }
