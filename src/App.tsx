import { FormEvent, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { InlineScanLayer } from './components/InlineScanLayer'
import { LandmarkScene } from './components/LandmarkScene'
import {
  initialLandmarkId,
  landmarks,
  type LandmarkId,
} from './data/landmarks'
import { useExperiencePhase } from './hooks/useExperiencePhase'
import { normalizeDestinationUrl } from './lib/qr'
import {
  buildShareUrl,
  decodeShareHash,
  DEFAULT_PRESET_ID,
  SHARE_STATE_VERSION,
  type ShareStateV1,
} from './lib/shareState'

import { scanPixelSize } from './lib/scanLayout'

const DEFAULT_URL = 'https://example.com'

function readInitialShareState(): ShareStateV1 {
  if (typeof window !== 'undefined') {
    const decoded = decodeShareHash(window.location.hash)
    if (decoded.ok) return decoded.value
  }

  return {
    v: SHARE_STATE_VERSION,
    url: DEFAULT_URL,
    landmarkId: initialLandmarkId,
    presetId: DEFAULT_PRESET_ID,
  }
}

export default function App() {
  const liveLandmarkCount = landmarks.filter((item) => item.ready).length
  const queuedLandmarkCount = landmarks.length - liveLandmarkCount
  const [initialShareState] = useState(readInitialShareState)
  const [draftUrl, setDraftUrl] = useState(initialShareState.url)
  const [encodedUrl, setEncodedUrl] = useState(initialShareState.url)
  const [landmarkId, setLandmarkId] = useState<LandmarkId>(
    initialShareState.landmarkId,
  )
  const frameRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame || typeof ResizeObserver === 'undefined') return
    const update = () => frame.style.setProperty('--qr-size', `${scanPixelSize(frame.clientWidth, frame.clientHeight)}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])
  const [urlError, setUrlError] = useState('')
  const [sceneFailed, setSceneFailed] = useState(false)
  const {
    phase,
    reveal,
    completeReveal,
    returnToExplore,
    completeReturn,
    reset,
  } = useExperiencePhase()

  const landmark = useMemo(
    () => landmarks.find((item) => item.id === landmarkId) ?? landmarks[0],
    [landmarkId],
  )

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''

    const result = buildShareUrl(window.location.href, {
      v: SHARE_STATE_VERSION,
      url: encodedUrl,
      landmarkId,
      presetId: DEFAULT_PRESET_ID,
    })

    return result.ok ? result.value : window.location.href
  }, [encodedUrl, landmarkId])

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault()
    const result = normalizeDestinationUrl(draftUrl)

    if (!result.ok) {
      setUrlError(result.error.message)
      return
    }

    setDraftUrl(result.value)
    setEncodedUrl(result.value)
    setUrlError('')
    reset()
  }

  const handleLandmarkChange = (nextLandmarkId: LandmarkId) => {
    setLandmarkId(nextLandmarkId)
    setSceneFailed(false)
    reset()
  }

  const handleSceneUnavailable = useCallback(() => {
    setSceneFailed(true)
  }, [])

  const handleReveal = useCallback(() => {
    reveal()
  }, [reveal])

  const handleCloseScan = () => {
    returnToExplore()
  }

  return (
    <main className="app-shell">
      <section className="hero-copy">
        <div>
          <p className="eyebrow">LANDMARK QR / THE ARCHITECTURE COLLECTION</p>
          <h1>
            Paste a link.
            <span>Create a landmark.</span>
          </h1>
          <p className="hero-description">
            A little architecture. A link worth sharing. Explore a landmark, then tap to reveal your QR.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-dot" />
          {liveLandmarkCount} themes live · {queuedLandmarkCount} queued
        </div>
      </section>

      <section className="workspace">
        <aside className="control-panel">
          <form onSubmit={handleGenerate} className="url-form">
            <label htmlFor="url">Destination URL</label>
            <div className="url-row">
              <input
                id="url"
                value={draftUrl}
                onChange={(event) => {
                  setDraftUrl(event.target.value)
                  if (urlError) setUrlError('')
                }}
                spellCheck={false}
                inputMode="url"
                placeholder="https://your-link.com"
                aria-invalid={Boolean(urlError)}
                aria-describedby={urlError ? 'url-error' : undefined}
              />
              <button type="submit" className="primary-button">
                Generate
              </button>
            </div>
            {urlError && (
              <p id="url-error" className="form-error" role="alert">
                {urlError}
              </p>
            )}
          </form>

          <div className="panel-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Theme library</p>
                <h2>Choose a landmark</h2>
              </div>
              <span>10 total</span>
            </div>

            <div className="landmark-grid">
              {landmarks.filter(item => item.ready).map((item) => {
                const selected = item.id === landmarkId
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`landmark-card ${selected ? 'is-selected' : ''}`}
                    disabled={!item.ready}
                    onClick={() => item.ready && handleLandmarkChange(item.id)}
                    style={{ '--accent': item.accent } as React.CSSProperties}
                  >
                    <span className="landmark-emoji">{item.emoji}</span>
                    <span className="landmark-copy">
                      <strong>{item.name}</strong>
                      <small>
                        {item.city} · {item.ready ? 'Live' : 'Coming soon'}
                      </small>
                    </span>
                  </button>
                )
              })}
            </div>
            {queuedLandmarkCount > 0 && (
              <details className="upcoming-themes"><summary>{queuedLandmarkCount} more landmarks · Coming soon</summary>
                {landmarks.filter(item => !item.ready).map(item => <button type="button" className="landmark-card" disabled key={item.id}>{item.name}</button>)}
              </details>
            )}
          </div>

          <div className="architecture-note">
            <span>YOUR LINK, A NEW PERSPECTIVE</span>
            <p>
              Choose a destination. Explore the miniature. Tap to scan, or share the interactive experience.
            </p>
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <p className="preview-label">3D EXPERIENCE</p>
              <h2>{landmark.name}</h2>
            </div>
            <button
              type="button"
              className="scan-button"
              onClick={handleReveal}
              disabled={phase !== 'explore'}
            >
              <span className="scan-icon" aria-hidden="true" />
              {phase === 'explore'
                ? 'Transform to QR'
                : phase === 'scan'
                  ? 'QR revealed'
                  : phase === 'returning'
                    ? 'Rebuilding…'
                    : 'Transforming…'}
            </button>
          </div>

          <div ref={frameRef} className="scene-frame" data-phase={phase}>
            <LandmarkScene
              value={encodedUrl}
              landmarkId={landmarkId}
              phase={phase}
              onRevealRequest={handleReveal}
              onRevealComplete={completeReveal}
              onReturnComplete={completeReturn}
              onSceneUnavailable={handleSceneUnavailable}
            />
            <InlineScanLayer
              destinationUrl={encodedUrl}
              landmarkName={landmark.name}
              qrMark={landmark.qrMark}
              shareUrl={shareUrl}
              downloadFileName={`${landmark.id}-landmark-qr.svg`}
              onReturn={handleCloseScan}
              visible={phase === 'scan'}
            />
            {phase !== 'scan' && (
              <div className="scene-tip">
                {phase === 'explore'
                  ? sceneFailed
                    ? '2.5D preview active · Tap the building to transform'
                    : 'Tap the building to transform · Drag to rotate · Pinch to zoom'
                  : phase === 'returning'
                    ? 'Rebuilding the landmark…'
                    : 'Revealing your QR…'}
              </div>
            )}
          </div>

          <div className="preview-footer">
            <div className="encoded-value">
              <span>ENCODED</span>
              <p>{encodedUrl}</p>
            </div>
            <div className="engine-pills" aria-label="Rendering details">
              <span>3D Matrix</span>
              <span>Error correction H</span>
              <span>Scan-safe mode</span>
            </div>
          </div>
        </section>
      </section>

    </main>
  )
}

