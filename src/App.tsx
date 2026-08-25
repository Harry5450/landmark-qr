import { FormEvent, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { LandmarkScene } from './components/LandmarkScene'
import {
  initialLandmarkId,
  landmarks,
  type LandmarkId,
} from './data/landmarks'

const DEFAULT_URL = 'https://example.com'

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_URL
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function App() {
  const [draftUrl, setDraftUrl] = useState(DEFAULT_URL)
  const [encodedUrl, setEncodedUrl] = useState(DEFAULT_URL)
  const [landmarkId, setLandmarkId] = useState<LandmarkId>(initialLandmarkId)
  const [scanOpen, setScanOpen] = useState(false)

  const landmark = useMemo(
    () => landmarks.find((item) => item.id === landmarkId) ?? landmarks[0],
    [landmarkId],
  )

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeUrl(draftUrl)
    setDraftUrl(normalized)
    setEncodedUrl(normalized)
    setScanOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-copy">
        <div>
          <p className="eyebrow">LANDMARK QR · PROTOTYPE 01</p>
          <h1>
            Paste a link.
            <span>Create a landmark.</span>
          </h1>
          <p className="hero-description">
            A 3D QR experience where world landmarks rise from a real QR matrix.
            The decorative scene is separated from Scan Mode so visual styling never
            compromises readability.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-dot" />
          3 themes live · 7 queued
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
                onChange={(event) => setDraftUrl(event.target.value)}
                spellCheck={false}
                inputMode="url"
                placeholder="https://your-link.com"
              />
              <button type="submit" className="primary-button">
                Generate
              </button>
            </div>
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
              {landmarks.map((item) => {
                const selected = item.id === landmarkId
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`landmark-card ${selected ? 'is-selected' : ''}`}
                    disabled={!item.ready}
                    onClick={() => item.ready && setLandmarkId(item.id)}
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
          </div>

          <div className="architecture-note">
            <span>ENGINE RULE</span>
            <p>
              Landmark models are replaceable assets. QR generation, interaction and
              scan safety stay shared across every theme.
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
              onClick={() => setScanOpen(true)}
            >
              <span className="scan-icon" aria-hidden="true" />
              Scan QR
            </button>
          </div>

          <div className="scene-frame">
            <LandmarkScene value={encodedUrl} landmarkId={landmarkId} />
            <div className="scene-tip">Drag to rotate · Pinch to zoom</div>
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

      {scanOpen && (
        <div className="scan-overlay" role="dialog" aria-modal="true" aria-label="Scan QR">
          <button
            type="button"
            className="scan-backdrop"
            aria-label="Close scan mode"
            onClick={() => setScanOpen(false)}
          />
          <section className="scan-card">
            <div className="scan-card-header">
              <div>
                <p>SCAN-SAFE MODE</p>
                <h2>{landmark.name}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setScanOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="qr-paper">
              <QRCodeSVG
                value={encodedUrl}
                size={292}
                level="H"
                bgColor="#ffffff"
                fgColor="#0b1020"
                includeMargin
              />
            </div>

            <p className="scan-hint">
              Decorative 3D content is removed here by design. This is the canonical QR
              for scanning and validation.
            </p>
            <div className="scan-url">{encodedUrl}</div>
          </section>
        </div>
      )}
    </main>
  )
}
