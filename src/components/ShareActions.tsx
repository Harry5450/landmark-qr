import { useId, useState } from 'react'

type ShareActionsProps = {
  shareUrl: string
  destinationUrl: string
  onDownloadQr: () => void | Promise<void>
  onReturn: () => void
  shareTitle?: string
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.append(input)
  input.select()

  let copied = false
  try {
    copied = document.execCommand?.('copy') ?? false
  } finally {
    input.remove()
  }

  if (!copied) {
    throw new Error('Clipboard access is unavailable.')
  }
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function ShareActions({
  shareUrl,
  destinationUrl,
  onDownloadQr,
  onReturn,
  shareTitle = 'Landmark QR',
}: ShareActionsProps) {
  const [status, setStatus] = useState('')
  const downloadDescriptionId = useId()

  const handleCopy = async () => {
    try {
      await copyText(shareUrl)
      setStatus('Share link copied.')
    } catch {
      setStatus('Could not copy the share link.')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Open this ${shareTitle} experience.`,
          url: shareUrl,
        })
        setStatus('Share sheet opened.')
        return
      } catch (error) {
        if (isShareCancellation(error)) {
          setStatus('Sharing cancelled.')
          return
        }
      }
    }

    try {
      await copyText(shareUrl)
      setStatus('Native sharing is unavailable. Share link copied instead.')
    } catch {
      setStatus('Sharing is unavailable on this device.')
    }
  }

  const handleDownload = async () => {
    try {
      await onDownloadQr()
      setStatus('QR code downloaded for the destination URL.')
    } catch {
      setStatus('Could not download the QR code.')
    }
  }

  return (
    <div className="share-actions" aria-label="QR and sharing actions">
      <div className="share-actions__primary">
        <button type="button" className="share-action-button" onClick={handleCopy}>
          Copy link
        </button>
        <button type="button" className="share-action-button" onClick={handleShare}>
          Share
        </button>
        <button
          type="button"
          className="share-action-button"
          onClick={handleDownload}
          aria-describedby={downloadDescriptionId}
        >
          Download QR
        </button>
      </div>

      <p id={downloadDescriptionId} className="share-actions__hint">
        Download encodes the destination, not the interactive share page: {destinationUrl}
      </p>

      <button type="button" className="share-action-button is-return" onClick={onReturn}>
        Return to 3D
      </button>

      <p className="share-actions__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}

export type { ShareActionsProps }
