import { useEffect, useId, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_QUIET_ZONE_MODULES,
} from '../lib/qr'
import { ShareActions } from './ShareActions'

type ScanSurfaceProps = {
  destinationUrl: string
  landmarkName: string
  shareUrl: string
  onClose: () => void
  downloadFileName?: string
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

export function ScanSurface({
  destinationUrl,
  landmarkName,
  shareUrl,
  onClose,
  downloadFileName = 'landmark-qr.svg',
}: ScanSurfaceProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const qrRef = useRef<SVGSVGElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [])

  const handleDownload = () => {
    if (!qrRef.current) {
      throw new Error('The canonical QR is not available.')
    }

    downloadSvg(qrRef.current, downloadFileName)
  }

  return (
    <div className="scan-overlay">
      <button
        type="button"
        className="scan-backdrop"
        aria-label="Dismiss scan mode"
        onClick={onClose}
      />

      <section
        className="scan-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="scan-card-header">
          <div>
            <p>SCAN-SAFE MODE</p>
            <h2 id={titleId}>Scan QR for {landmarkName}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close scan mode"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="qr-paper" data-testid="canonical-qr">
          <QRCodeSVG
            ref={qrRef}
            value={destinationUrl}
            size={292}
            level={QR_ERROR_CORRECTION_LEVEL}
            marginSize={QR_QUIET_ZONE_MODULES}
            bgColor="#ffffff"
            fgColor="#0b1020"
            title={`QR code for ${destinationUrl}`}
          />
        </div>

        <p id={descriptionId} className="scan-hint">
          Decorative 3D content is removed here. This flat, high-contrast QR is the
          canonical surface for scanning and validation.
        </p>
        <p className="scan-url" aria-label="Destination URL">
          {destinationUrl}
        </p>

        <ShareActions
          shareUrl={shareUrl}
          destinationUrl={destinationUrl}
          onDownloadQr={handleDownload}
          onReturn={onClose}
          shareTitle={`${landmarkName} Landmark QR`}
        />
      </section>
    </div>
  )
}

export type { ScanSurfaceProps }
