'use client'

import { useState, useRef, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const DPI = 180
const MAX_PRINT_HEIGHT_MM = 18.1
const MM_PER_INCH = 25.4

const TAPE_PRESETS = [
  { label: '6mm tape',  widthMM: 6,  heightIN: 0.236 },
  { label: '9mm tape',  widthMM: 9,  heightIN: 0.354 },
  { label: '12mm tape', widthMM: 12, heightIN: 0.472 },
  { label: '18mm tape', widthMM: 18, heightIN: 0.709 },
  { label: '24mm tape', widthMM: 24, heightIN: 0.945 },
]

const ROD_PRESETS: Record<string, Record<string, string>> = {
  'Walleye Jigging Rod': {
    brand: 'SW CUSTOM RODS',
    model: 'WJ762M',
    length: "7'6\"",
    lineWeight: '6-12#',
    lureWeight: '1/8 - 3/8 oz.',
    power: 'MEDIUM',
    action: 'FAST',
    serial: '<SERIAL # WJ-2026-01>',
    builder: 'Steve Wehr',
  },
  'Heavy Bass Casting': {
    brand: 'SW CUSTOM RODS',
    model: 'HBC744H',
    length: "7'4\"",
    lineWeight: '17-25#',
    lureWeight: '3/8 - 1.5 oz.',
    power: 'HEAVY',
    action: 'MOD-FAST',
    serial: '<SERIAL # HB-2026-01>',
    builder: 'Steve Wehr',
  },
  'Ice Panfish Rod': {
    brand: 'SW CUSTOM RODS',
    model: 'IP240UL',
    length: '24"',
    lineWeight: '1-4#',
    lureWeight: '1/64 - 1/8 oz.',
    power: 'ULTRA LIGHT',
    action: 'FAST',
    serial: '<SERIAL # IP-2026-01>',
    builder: 'Steve Wehr',
  },
  'Musky Casting Rod': {
    brand: 'SW CUSTOM RODS',
    model: 'MX900XH',
    length: "9'0\"",
    lineWeight: '40-80#',
    lureWeight: '3 - 10 oz.',
    power: 'X-HEAVY',
    action: 'MOD',
    serial: '<SERIAL # MX-2026-01>',
    builder: 'Steve Wehr',
  },
  'Logo Only Decal': {
    brand: 'SW CUSTOM RODS',
    model: '',
    length: '',
    lineWeight: '',
    lureWeight: '',
    power: '',
    action: '',
    serial: '',
    builder: '',
  },
  'Minimal Pro Spec Label': {
    brand: 'SW CUSTOM RODS',
    model: 'SJ843',
    length: "7'",
    lineWeight: '8-15#',
    lureWeight: '3/16 - 5/8 oz.',
    power: '',
    action: '',
    serial: '<SERIAL # RS-2026-01>',
    builder: '',
  },
}

const DEFAULT_LABEL = {
  brand: 'SW CUSTOM RODS',
  model: 'SJ843',
  length: "7'",
  lineWeight: '8-15#',
  lureWeight: '3/16 - 5/8 oz.',
  power: 'MEDIUM',
  action: 'FAST',
  serial: '<SERIAL # RS-2026-01>',
  builder: '',
  fontSize: 7,
  letterSpacing: 1,
  logoStyle: 'bold-sans',
  theme: 'dark',
  labelWidthIN: 3.0,
  labelHeightIN: 0.47,
  tapeWidthMM: 12,
  invertColors: false,
  thickenLines: false,
}

type LabelConfig = typeof DEFAULT_LABEL

// ─── SVG Decal Component ──────────────────────────────────────────────────────
function DecalSVG({ cfg, scale = 1 }: { cfg: LabelConfig; forExport?: boolean; scale?: number }) {
  const W = cfg.labelWidthIN * DPI * scale
  const H = cfg.labelHeightIN * DPI * scale
  const dark = cfg.theme === 'dark'
  const inv = cfg.invertColors

  let bg = dark ? '#1a1a1a' : '#ffffff'
  let fg = dark ? '#e8e8e8' : '#111111'
  let accent = dark ? '#c0a060' : '#8b6914'
  let divider = dark ? '#444444' : '#cccccc'
  let specLabel = dark ? '#888888' : '#999999'
  let modelColor = dark ? '#ffffff' : '#000000'

  if (inv) {
    ;[bg, fg] = [fg, bg]
    accent = dark ? '#1a1a1a' : '#f0f0f0'
    divider = dark ? '#cccccc' : '#444444'
    modelColor = dark ? '#000000' : '#ffffff'
    specLabel = dark ? '#555555' : '#aaaaaa'
  }

  const fs = cfg.fontSize * scale
  const ls = cfg.letterSpacing * scale
  const pad = 8 * scale
  const divX = W * 0.32
  const logoY = H / 2
  const specAreaX = divX + pad * 1.5
  const lineH = fs * 1.45

  const specs: Array<{ k: string; v: string; bold: boolean; small?: boolean }> = []
  if (cfg.model) specs.push({ k: 'MODEL', v: cfg.model, bold: true })

  const row2Parts: string[] = []
  if (cfg.length) row2Parts.push(cfg.length)
  if (cfg.lineWeight) row2Parts.push(cfg.lineWeight)
  if (cfg.lureWeight) row2Parts.push(cfg.lureWeight)
  if (row2Parts.length) specs.push({ k: 'SPECS', v: row2Parts.join('  ·  '), bold: false })

  const row3Parts: string[] = []
  if (cfg.power) row3Parts.push(cfg.power)
  if (cfg.action) row3Parts.push(cfg.action + ' ACTION')
  if (row3Parts.length) specs.push({ k: 'ACTION', v: row3Parts.join('  /  '), bold: false })

  if (cfg.serial) specs.push({ k: '', v: cfg.serial, bold: false, small: true })
  if (cfg.builder) specs.push({ k: 'BUILT BY', v: cfg.builder, bold: false, small: true })

  const totalSpecH = specs.length * lineH
  const specStartY = (H - totalSpecH) / 2 + fs * 0.85

  const logoFontSize = Math.min(H * 0.38, fs * 2.8) * scale

  const fontFamily =
    cfg.logoStyle === 'bold-sans'
      ? "'Arial Black', 'Impact', sans-serif"
      : cfg.logoStyle === 'serif'
      ? "'Georgia', 'Times New Roman', serif"
      : cfg.logoStyle === 'mono'
      ? "'Courier New', monospace"
      : "'Arial', sans-serif"

  const lineThick = cfg.thickenLines ? 1.5 * scale : 0.5 * scale

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', fontFamily: "'Arial', sans-serif" }}
    >
      <rect width={W} height={H} fill={bg} />
      <rect
        x={lineThick / 2}
        y={lineThick / 2}
        width={W - lineThick}
        height={H - lineThick}
        fill="none"
        stroke={divider}
        strokeWidth={lineThick}
      />
      <line x1={0} y1={H * 0.06} x2={divX - pad} y2={H * 0.06} stroke={accent} strokeWidth={lineThick * 0.8} />
      <line x1={0} y1={H * 0.94} x2={divX - pad} y2={H * 0.94} stroke={accent} strokeWidth={lineThick * 0.8} />

      <text
        x={divX / 2}
        y={logoY + logoFontSize * 0.35}
        textAnchor="middle"
        fontFamily={fontFamily}
        fontSize={logoFontSize}
        fontWeight="900"
        fill={fg}
        letterSpacing={ls * 2}
      >
        {cfg.brand || 'SW CUSTOM RODS'}
      </text>

      <line x1={divX} y1={pad * 1.5} x2={divX} y2={H - pad * 1.5} stroke={divider} strokeWidth={lineThick} />
      <circle cx={divX} cy={H / 2} r={2 * scale} fill={accent} />

      {specs.map((s, i) => {
        const y = specStartY + i * lineH
        const vFontSize = s.bold ? fs * 1.25 : s.small ? fs * 0.8 : fs
        const vColor = s.bold ? modelColor : s.small ? specLabel : fg
        const vWeight = s.bold ? '700' : '400'
        return (
          <g key={i}>
            {s.k && (
              <text
                x={specAreaX}
                y={y}
                fontFamily="'Arial', sans-serif"
                fontSize={fs * 0.65}
                fontWeight="400"
                fill={specLabel}
                letterSpacing={ls * 0.8}
              >
                {s.k}
              </text>
            )}
            <text
              x={s.k ? specAreaX + 38 * scale : specAreaX}
              y={y}
              fontFamily="'Arial', sans-serif"
              fontSize={vFontSize}
              fontWeight={vWeight}
              fill={vColor}
              letterSpacing={ls}
            >
              {s.v}
            </text>
          </g>
        )
      })}

      <line x1={pad * 0.5} y1={pad * 0.5} x2={pad * 2} y2={pad * 0.5} stroke={accent} strokeWidth={lineThick} />
      <line x1={pad * 0.5} y1={pad * 0.5} x2={pad * 0.5} y2={pad * 2} stroke={accent} strokeWidth={lineThick} />
      <line x1={W - pad * 2} y1={H - pad * 0.5} x2={W - pad * 0.5} y2={H - pad * 0.5} stroke={accent} strokeWidth={lineThick} />
      <line x1={W - pad * 0.5} y1={H - pad * 2} x2={W - pad * 0.5} y2={H - pad * 0.5} stroke={accent} strokeWidth={lineThick} />
    </svg>
  )
}

// ─── SVG string builder (for export — avoids JSX serialization) ───────────────
function buildSVGString(cfg: LabelConfig): string {
  const W = Math.round(cfg.labelWidthIN * DPI)
  const H = Math.round(cfg.labelHeightIN * DPI)
  const dark = cfg.theme === 'dark'
  const inv = cfg.invertColors

  let bg = dark ? '#1a1a1a' : '#ffffff'
  let fg = dark ? '#e8e8e8' : '#111111'
  let accent = dark ? '#c0a060' : '#8b6914'
  let divider = dark ? '#444444' : '#cccccc'
  let specLabel = dark ? '#888888' : '#999999'
  let modelColor = dark ? '#ffffff' : '#000000'

  if (inv) {
    ;[bg, fg] = [fg, bg]
    accent = dark ? '#1a1a1a' : '#f0f0f0'
    divider = dark ? '#cccccc' : '#444444'
    modelColor = dark ? '#000000' : '#ffffff'
    specLabel = dark ? '#555555' : '#aaaaaa'
  }

  const fs = cfg.fontSize
  const ls = cfg.letterSpacing
  const pad = 8
  const divX = W * 0.32
  const logoY = H / 2
  const specAreaX = divX + pad * 1.5
  const lineH = fs * 1.45
  const logoFontSize = Math.min(H * 0.38, fs * 2.8)
  const fontFamily =
    cfg.logoStyle === 'bold-sans'
      ? 'Arial Black, Impact, sans-serif'
      : cfg.logoStyle === 'serif'
      ? 'Georgia, Times New Roman, serif'
      : cfg.logoStyle === 'mono'
      ? 'Courier New, monospace'
      : 'Arial, sans-serif'
  const lineThick = cfg.thickenLines ? 1.5 : 0.5

  const specs: Array<{ k: string; v: string; bold: boolean; small?: boolean }> = []
  if (cfg.model) specs.push({ k: 'MODEL', v: cfg.model, bold: true })
  const row2Parts: string[] = []
  if (cfg.length) row2Parts.push(cfg.length)
  if (cfg.lineWeight) row2Parts.push(cfg.lineWeight)
  if (cfg.lureWeight) row2Parts.push(cfg.lureWeight)
  if (row2Parts.length) specs.push({ k: 'SPECS', v: row2Parts.join('  ·  '), bold: false })
  const row3Parts: string[] = []
  if (cfg.power) row3Parts.push(cfg.power)
  if (cfg.action) row3Parts.push(cfg.action + ' ACTION')
  if (row3Parts.length) specs.push({ k: 'ACTION', v: row3Parts.join('  /  '), bold: false })
  if (cfg.serial) specs.push({ k: '', v: cfg.serial, bold: false, small: true })
  if (cfg.builder) specs.push({ k: 'BUILT BY', v: cfg.builder, bold: false, small: true })

  const totalSpecH = specs.length * lineH
  const specStartY = (H - totalSpecH) / 2 + fs * 0.85

  const specRows = specs
    .map((s, i) => {
      const y = specStartY + i * lineH
      const vFontSize = s.bold ? fs * 1.25 : s.small ? fs * 0.8 : fs
      const vColor = s.bold ? modelColor : s.small ? specLabel : fg
      const vWeight = s.bold ? '700' : '400'
      const kText = s.k
        ? `<text x="${specAreaX}" y="${y}" font-family="Arial, sans-serif" font-size="${fs * 0.65}" font-weight="400" fill="${specLabel}" letter-spacing="${ls * 0.8}">${s.k}</text>`
        : ''
      const vText = `<text x="${s.k ? specAreaX + 38 : specAreaX}" y="${y}" font-family="Arial, sans-serif" font-size="${vFontSize}" font-weight="${vWeight}" fill="${vColor}" letter-spacing="${ls}">${s.v}</text>`
      return kText + vText
    })
    .join('\n  ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="${lineThick / 2}" y="${lineThick / 2}" width="${W - lineThick}" height="${H - lineThick}" fill="none" stroke="${divider}" stroke-width="${lineThick}"/>
  <line x1="0" y1="${H * 0.06}" x2="${divX - pad}" y2="${H * 0.06}" stroke="${accent}" stroke-width="${lineThick * 0.8}"/>
  <line x1="0" y1="${H * 0.94}" x2="${divX - pad}" y2="${H * 0.94}" stroke="${accent}" stroke-width="${lineThick * 0.8}"/>
  <text x="${divX / 2}" y="${logoY + logoFontSize * 0.35}" text-anchor="middle" font-family="${fontFamily}" font-size="${logoFontSize}" font-weight="900" fill="${fg}" letter-spacing="${ls * 2}">${cfg.brand || 'SW CUSTOM RODS'}</text>
  <line x1="${divX}" y1="${pad * 1.5}" x2="${divX}" y2="${H - pad * 1.5}" stroke="${divider}" stroke-width="${lineThick}"/>
  <circle cx="${divX}" cy="${H / 2}" r="2" fill="${accent}"/>
  ${specRows}
  <line x1="${pad * 0.5}" y1="${pad * 0.5}" x2="${pad * 2}" y2="${pad * 0.5}" stroke="${accent}" stroke-width="${lineThick}"/>
  <line x1="${pad * 0.5}" y1="${pad * 0.5}" x2="${pad * 0.5}" y2="${pad * 2}" stroke="${accent}" stroke-width="${lineThick}"/>
  <line x1="${W - pad * 2}" y1="${H - pad * 0.5}" x2="${W - pad * 0.5}" y2="${H - pad * 0.5}" stroke="${accent}" stroke-width="${lineThick}"/>
  <line x1="${W - pad * 0.5}" y1="${H - pad * 2}" x2="${W - pad * 0.5}" y2="${H - pad * 0.5}" stroke="${accent}" stroke-width="${lineThick}"/>
</svg>`
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RodLabelStudio() {
  const [cfg, setCfg] = useState<LabelConfig>({ ...DEFAULT_LABEL })
  const [copied, setCopied] = useState(false)
  // ref kept for potential future use (e.g. html2canvas fallback)
  const _svgRef = useRef<HTMLDivElement>(null)

  const set = useCallback(<K extends keyof LabelConfig>(key: K, val: LabelConfig[K]) => {
    setCfg((c) => ({ ...c, [key]: val }))
  }, [])

  const pxW = Math.round(cfg.labelWidthIN * DPI)
  const pxH = Math.round(cfg.labelHeightIN * DPI)
  const heightMM = cfg.labelHeightIN * MM_PER_INCH
  const heightWarning = heightMM > MAX_PRINT_HEIGHT_MM
  const fontWarning = cfg.fontSize < 5

  const previewScale = Math.min(680 / pxW, 180 / pxH, 3)

  const downloadSVG = () => {
    const svg = buildSVGString(cfg)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cfg.brand || 'rod'}-label.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = (monochrome = false) => {
    const svg = buildSVGString(cfg)
    const img = new Image()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pxW
      canvas.height = pxH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, pxW, pxH)
      if (monochrome) {
        const imageData = ctx.getImageData(0, 0, pxW, pxH)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const v = lum < 128 ? 0 : 255
          data[i] = data[i + 1] = data[i + 2] = v
        }
        ctx.putImageData(imageData, 0, 0)
      }
      canvas.toBlob((b) => {
        if (!b) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(b)
        a.download = `${cfg.brand || 'rod'}-label${monochrome ? '-bw' : ''}.png`
        a.click()
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const copySVG = () => {
    navigator.clipboard.writeText(buildSVGString(cfg)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const applyPreset = (name: string) => {
    const p = ROD_PRESETS[name]
    if (p) setCfg((c) => ({ ...c, ...p }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1e1e1e',
    border: '1px solid #2e2e2e',
    borderRadius: 3,
    padding: '5px 8px',
    fontSize: 11,
    color: '#ddd',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#666',
    letterSpacing: 1.5,
    display: 'block',
    marginBottom: 3,
  }

  return (
    <div style={{ fontFamily: "'Arial', sans-serif", background: '#0f0f0f', color: '#e0e0e0', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: '#141414', borderBottom: '1px solid #2a2a2a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 6, height: 32, background: 'linear-gradient(180deg,#B8942A,#7a5e10)', borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: '#f0f0f0' }}>ROD LABEL STUDIO</div>
            <div style={{ fontSize: 10, color: '#888', letterSpacing: 1.5 }}>CUSTOM ROD DECAL DESIGNER · EPSON LW-PX400 READY</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#555', textAlign: 'right' }}>
          <div>180 DPI · THERMAL TRANSFER</div>
          <div>LW-PX400 COMPATIBLE</div>
        </div>
      </div>

      {/* Preview area */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ background: cfg.theme === 'dark' ? '#2a2a2a' : '#e8e8e8', borderRadius: 6, padding: '20px 32px', boxShadow: '0 4px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
            PREVIEW · {cfg.labelWidthIN.toFixed(2)}&quot; × {cfg.labelHeightIN.toFixed(2)}&quot; · {pxW}×{pxH}px @ 180 DPI
          </div>
          <div ref={_svgRef} style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            <DecalSVG cfg={cfg} scale={previewScale} />
          </div>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 0.5, marginTop: 8, textAlign: 'center' }}>
            ↑ Preview scaled for display · Exports at exact pixel dimensions
          </div>
        </div>

        {(heightWarning || fontWarning) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {heightWarning && (
              <div style={{ background: '#2a1500', border: '1px solid #7a3000', borderRadius: 4, padding: '6px 12px', fontSize: 10, color: '#ff8c42' }}>
                ⚠ Label height {heightMM.toFixed(1)}mm exceeds 18.1mm max print head width
              </div>
            )}
            {fontWarning && (
              <div style={{ background: '#1a1a00', border: '1px solid #6a6000', borderRadius: 4, padding: '6px 12px', fontSize: 10, color: '#e0c840' }}>
                ⚠ Font size below 5px may not print crisp at 180 DPI
              </div>
            )}
          </div>
        )}

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={downloadSVG}
            style={{ background: '#B8942A', color: '#000', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer' }}
          >
            ↓ SVG
          </button>
          <button
            onClick={() => downloadPNG(false)}
            style={{ background: '#2a2a2a', color: '#e0e0e0', fontWeight: 600, fontSize: 11, letterSpacing: 1.5, padding: '8px 16px', borderRadius: 4, border: '1px solid #444', cursor: 'pointer' }}
          >
            ↓ PNG 180DPI
          </button>
          <button
            onClick={() => downloadPNG(true)}
            style={{ background: '#1a1a1a', color: '#bbb', fontWeight: 600, fontSize: 11, letterSpacing: 1.5, padding: '8px 16px', borderRadius: 4, border: '1px solid #333', cursor: 'pointer' }}
          >
            ↓ 1-BIT B/W PNG
          </button>
          <button
            onClick={copySVG}
            style={{
              background: copied ? '#1a3a1a' : '#1a1a1a',
              color: copied ? '#60e060' : '#bbb',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: 1.5,
              padding: '8px 16px',
              borderRadius: 4,
              border: `1px solid ${copied ? '#40a040' : '#333'}`,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ COPIED' : '⧉ COPY SVG'}
          </button>
        </div>
      </div>

      {/* Controls — three-column layout */}
      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>

        {/* Label content */}
        <div style={{ flex: '1 1 260px', background: '#141414', padding: '16px', borderRight: '1px solid #1e1e1e' }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #222' }}>LABEL CONTENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ ...labelStyle, fontWeight: 700 }}>BRAND / LOGO TEXT</label>
              <input
                value={cfg.brand}
                onChange={(e) => set('brand', e.target.value)}
                style={{ ...inputStyle, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#f0f0f0' }}
              />
            </div>
            {(
              [
                { key: 'model',       label: 'MODEL / BLANK #'   },
                { key: 'length',      label: 'LENGTH'             },
                { key: 'lineWeight',  label: 'LINE WEIGHT'        },
                { key: 'lureWeight',  label: 'LURE WEIGHT'        },
                { key: 'power',       label: 'POWER'              },
                { key: 'action',      label: 'ACTION'             },
                { key: 'serial',      label: 'SERIAL / SUBTEXT'   },
                { key: 'builder',     label: 'BUILDER NAME'       },
              ] as Array<{ key: keyof LabelConfig; label: string }>
            ).map(({ key, label }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  value={cfg[key] as string}
                  onChange={(e) => set(key, e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          {/* Presets */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginBottom: 8, paddingTop: 10, borderTop: '1px solid #222' }}>QUICK PRESETS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.keys(ROD_PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 3, padding: '5px 10px', fontSize: 10, color: '#aaa', cursor: 'pointer', textAlign: 'left' }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style & typography */}
        <div style={{ flex: '1 1 220px', background: '#141414', padding: '16px', borderRight: '1px solid #1e1e1e' }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #222' }}>STYLE &amp; TYPOGRAPHY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Theme */}
            <div>
              <label style={labelStyle}>THEME</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set('theme', t)}
                    style={{
                      flex: 1,
                      background: cfg.theme === t ? '#B8942A' : '#1e1e1e',
                      color: cfg.theme === t ? '#000' : '#888',
                      border: `1px solid ${cfg.theme === t ? '#B8942A' : '#2e2e2e'}`,
                      borderRadius: 3,
                      padding: '5px 0',
                      fontSize: 10,
                      fontWeight: cfg.theme === t ? 700 : 400,
                      cursor: 'pointer',
                      letterSpacing: 1,
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo font */}
            <div>
              <label style={labelStyle}>LOGO FONT STYLE</label>
              <select
                value={cfg.logoStyle}
                onChange={(e) => set('logoStyle', e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="bold-sans">Bold Sans-Serif (Impact)</option>
                <option value="serif">Classic Serif (Georgia)</option>
                <option value="mono">Technical Mono (Courier)</option>
                <option value="clean">Clean Sans (Arial)</option>
              </select>
            </div>

            {/* Font size */}
            <div>
              <label style={labelStyle}>SPEC FONT SIZE · {cfg.fontSize}px</label>
              <input
                type="range"
                min={4}
                max={14}
                value={cfg.fontSize}
                onChange={(e) => set('fontSize', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#B8942A' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#555' }}>
                <span>4px</span><span>14px</span>
              </div>
            </div>

            {/* Letter spacing */}
            <div>
              <label style={labelStyle}>LETTER SPACING · {cfg.letterSpacing}px</label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={cfg.letterSpacing}
                onChange={(e) => set('letterSpacing', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#B8942A' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#555' }}>
                <span>0</span><span>5px</span>
              </div>
            </div>

            {/* Print options */}
            <div style={{ paddingTop: 10, borderTop: '1px solid #222' }}>
              <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginBottom: 8 }}>PRINT OPTIONS</div>
              {(
                [
                  { key: 'invertColors',  label: 'Invert Colors'             },
                  { key: 'thickenLines',  label: 'Thicken Lines for Thermal' },
                ] as Array<{ key: keyof LabelConfig; label: string }>
              ).map(({ key, label }) => (
                <div
                  key={key}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}
                  onClick={() => set(key, !cfg[key])}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 2,
                      background: cfg[key] ? '#B8942A' : '#1e1e1e',
                      border: `1px solid ${cfg[key] ? '#B8942A' : '#3e3e3e'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cfg[key] && <span style={{ fontSize: 9, color: '#000', fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 10, color: '#aaa' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dimensions & Print */}
        <div style={{ flex: '1 1 220px', background: '#141414', padding: '16px' }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #222' }}>LABEL DIMENSIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Tape presets */}
            <div>
              <label style={labelStyle}>TAPE WIDTH PRESET</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {TAPE_PRESETS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => { set('tapeWidthMM', t.widthMM); set('labelHeightIN', t.heightIN) }}
                    style={{
                      background: cfg.tapeWidthMM === t.widthMM ? '#1e2e10' : '#1a1a1a',
                      border: `1px solid ${cfg.tapeWidthMM === t.widthMM ? '#4a8020' : '#2a2a2a'}`,
                      borderRadius: 3,
                      padding: '4px 8px',
                      fontSize: 10,
                      color: cfg.tapeWidthMM === t.widthMM ? '#90d050' : '#777',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{t.label}</span>
                    <span style={{ color: '#555' }}>{t.widthMM}mm</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>LABEL WIDTH (inches)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="12"
                value={cfg.labelWidthIN}
                onChange={(e) => set('labelWidthIN', Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>LABEL HEIGHT (inches)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="1"
                value={cfg.labelHeightIN}
                onChange={(e) => set('labelHeightIN', Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Printer info */}
            <div style={{ background: '#0e1a0e', border: '1px solid #1e3a1e', borderRadius: 4, padding: 10 }}>
              <div style={{ fontSize: 9, color: '#4a8040', letterSpacing: 1.5, marginBottom: 6 }}>PRINTER SPECS</div>
              {(
                [
                  ['Printer',       'Epson LW-PX400'                     ],
                  ['Method',        'Thermal Transfer'                    ],
                  ['Resolution',    '180 DPI'                             ],
                  ['Export Width',  `${pxW} px`                          ],
                  ['Export Height', `${pxH} px`                          ],
                  ['Height (mm)',   `${heightMM.toFixed(2)} mm`          ],
                  ['Max Print Head','18.1 mm'                             ],
                  ['Status',        heightWarning ? '⚠ OVER LIMIT' : '✓ WITHIN LIMIT'],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                  <span style={{ color: '#4a7040' }}>{k}</span>
                  <span style={{ color: k === 'Status' && heightWarning ? '#ff7040' : k === 'Status' ? '#60d060' : '#a0c080', fontWeight: k === 'Status' ? 700 : 400 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 4, padding: 8, fontSize: 9, color: '#555', lineHeight: 1.6 }}>
              <div style={{ color: '#666', letterSpacing: 1, marginBottom: 4 }}>EXPORT NOTES</div>
              · SVG preserves exact dimensions &amp; fonts<br />
              · PNG exports at full 180 DPI resolution<br />
              · 1-bit B/W PNG for cleanest thermal transfer<br />
              · Import SVG into Epson Label Editor<br />
              · Min recommended font: 5px at 180 DPI
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#0a0a0a', borderTop: '1px solid #1e1e1e', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>ROD LABEL STUDIO · EPSON LW-PX400 COMPATIBLE · 180 DPI</span>
        <span style={{ fontSize: 9, color: '#333', letterSpacing: 0.5 }}>SVG · PNG · 1-BIT THERMAL EXPORT</span>
      </div>
    </div>
  )
}
