'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { generateApi, profilesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PAGE_TYPES = [
  { id: 'blank', label: 'Blank', icon: '◻' },
  { id: 'lined', label: 'Lined', icon: '≡' },
  { id: 'double-lined', label: 'Double', icon: '⊟' },
  { id: 'ruled', label: 'Ruled', icon: '▤' },
  { id: 'grid', label: 'Grid', icon: '⊞' },
];

const PEN_TYPES = [
  { id: 'ballpoint', label: '🖊 Ballpoint' },
  { id: 'fountain', label: '🖋 Fountain' },
  { id: 'gel', label: '✒ Gel' },
  { id: 'pencil', label: '✏ Pencil' },
  { id: 'marker', label: '🖌 Marker' },
];

const INK_COLORS = [
  { hex: '#1a1a2e', label: 'Navy' },
  { hex: '#0d0d0d', label: 'Black' },
  { hex: '#1a3a6e', label: 'Royal Blue' },
  { hex: '#1a5c1a', label: 'Forest' },
  { hex: '#8b0000', label: 'Crimson' },
  { hex: '#4a0080', label: 'Violet' },
];

export default function GeneratePage() {
  const [text, setText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('page');
  const [settings, setSettings] = useState({
    pageType: 'lined',
    fontSize: 24,
    inkColor: '#1a1a2e',
    penType: 'ballpoint',
    imperfectionLevel: 0.5,
    slantAngle: 0,
    letterSpacing: 1.0,
    lineSpacing: 1.5,
    marginLeft: 60,
  });

  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.getAll().then((r) => r.data),
  });

  const handleGenerate = async () => {
    if (!text.trim()) { toast.error('Please enter some text!'); return; }
    if (text.length > 10000) { toast.error('Max 10,000 characters.'); return; }
    setIsGenerating(true);
    setResult(null);
    setCurrentPage(0);
    try {
      const res = await generateApi.generate({ text, profileId: selectedProfile || undefined, settings, title: title || undefined });
      setResult(res.data.generation);
      toast.success(`Generated ${res.data.generation.output?.pageCount || 1} page(s)! 🎉`);
    } catch (err: any) {
      if (err.response?.data?.upgradeRequired) toast.error('Limit reached. Upgrade to Pro!');
      else toast.error(err.response?.data?.message || 'Generation failed. Is the AI service running?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const readyProfiles = profilesData?.profiles?.filter((p: any) => p.status === 'ready') || [];

  const TABS = [
    { id: 'page', label: 'Page' },
    { id: 'ink', label: 'Ink & Pen' },
    { id: 'style', label: 'Style' },
  ];

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>
          ✍️ Generate Handwriting
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Paste your text, tune the style, and export as PDF or PNG.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* ── LEFT COLUMN ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

          {/* Title + Profile row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <input
              className="input-field"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '0.88rem' }}
            />
            <select
              className="input-field"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              style={{ fontSize: '0.88rem', cursor: 'pointer' }}
            >
              <option value="">Generic Style</option>
              {readyProfiles.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Text area */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <textarea
              id="generate-text"
              className="input-field"
              placeholder={"Type or paste your text here…\n\nThe AI will apply natural handwriting imperfections, slant, ink pressure variation, and spacing quirks — matching your uploaded handwriting profile if selected."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
              style={{ minHeight: 240, resize: 'vertical', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, fontSize: '0.95rem' }}
            />
            <span style={{
              position: 'absolute', bottom: 10, right: 14,
              fontSize: '0.72rem', color: text.length > 9000 ? 'var(--accent-pink)' : 'var(--text-muted)',
            }}>
              {text.length.toLocaleString()} / 10,000
            </span>
          </div>

          {/* Generate button */}
          <button
            id="generate-btn"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            style={{ width: '100%', padding: '15px', fontSize: '1rem', marginBottom: 20 }}
          >
            {isGenerating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⟳</motion.span>
                Writing… this takes 15–30 seconds
              </span>
            ) : '✍️ Generate Handwriting'}
          </button>

          {/* Loading animation */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass"
                style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', gap: 18, alignItems: 'center' }}
              >
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: '2rem' }}>🖊️</motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>AI is handwriting your text…</div>
                  {['Analysing style metrics', 'Applying slant & spacing', 'Rendering pages', 'Building PDF'].map((s, i) => (
                    <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ delay: i * 0.5, duration: 0.3 }} style={{ color: 'var(--accent-teal)' }}>✓</motion.span>
                      {s}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result preview */}
          <AnimatePresence>
            {result && result.status === 'completed' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Result header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>📄 {result.output?.pageCount || 0} Page(s) Generated</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{result.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {result.output?.pdfUrl && (
                      <button className="btn-primary" onClick={() => handleDownload(result.output.pdfUrl, `${result.title || 'handwriting'}.pdf`)}
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                        📥 PDF
                      </button>
                    )}
                    <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      🔄 Redo
                    </button>
                  </div>
                </div>

                {/* Page nav */}
                {(result.output?.pngUrls?.length || 0) > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <button className="btn-ghost" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>← Prev</button>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Page {currentPage + 1} of {result.output.pngUrls.length}</span>
                    <button className="btn-ghost" onClick={() => setCurrentPage(Math.min(result.output.pngUrls.length - 1, currentPage + 1))} disabled={currentPage === result.output.pngUrls.length - 1} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Next →</button>
                    <button className="btn-ghost" onClick={() => handleDownload(result.output.pngUrls[currentPage], `page-${currentPage + 1}.png`)} style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}>📥 PNG</button>
                  </div>
                )}

                {/* Preview image */}
                {result.output?.pngUrls?.[currentPage] ? (
                  <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                  }}>
                    <img src={result.output.pngUrls[currentPage]} alt={`Page ${currentPage + 1}`} style={{ width: '100%', display: 'block' }} />
                  </div>
                ) : (
                  <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 10 }}>📄</div>
                    <p>PDF generated · Download above</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── RIGHT: Settings Panel ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass" style={{ padding: 20, position: 'sticky', top: 20 }}>

          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 16 }}>⚙️ Style Settings</div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none',
                background: activeTab === t.id ? 'rgba(108,99,255,0.25)' : 'transparent',
                color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === t.id ? 600 : 400,
                fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
              }}>{t.label}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'page' && (
              <motion.div key="page" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                <Label>Page Type</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 18 }}>
                  {PAGE_TYPES.map(pt => (
                    <button key={pt.id} onClick={() => setSettings({ ...settings, pageType: pt.id })} style={{
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: settings.pageType === pt.id ? '1.5px solid rgba(108,99,255,0.7)' : '1px solid var(--border-subtle)',
                      background: settings.pageType === pt.id ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
                      color: settings.pageType === pt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: '0.9rem' }}>{pt.icon}</span>{pt.label}
                    </button>
                  ))}
                </div>

                <RangeRow label="Writing Size" value={`${settings.fontSize}px`}>
                  <input type="range" min={14} max={48} step={2} value={settings.fontSize}
                    onChange={e => setSettings({ ...settings, fontSize: +e.target.value })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                </RangeRow>

                <RangeRow label="Line Spacing" value={`${settings.lineSpacing.toFixed(1)}×`}>
                  <input type="range" min={1.0} max={3.0} step={0.1} value={settings.lineSpacing}
                    onChange={e => setSettings({ ...settings, lineSpacing: +e.target.value })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                </RangeRow>
              </motion.div>
            )}

            {activeTab === 'ink' && (
              <motion.div key="ink" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                <Label>Pen Type</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  {PEN_TYPES.map(pt => (
                    <button key={pt.id} onClick={() => setSettings({ ...settings, penType: pt.id })} style={{
                      padding: '8px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                      border: settings.penType === pt.id ? '1.5px solid rgba(108,99,255,0.7)' : '1px solid var(--border-subtle)',
                      background: settings.penType === pt.id ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
                      color: settings.penType === pt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.82rem', transition: 'all 0.18s',
                    }}>
                      {pt.label}
                    </button>
                  ))}
                </div>

                <Label>Ink Color</Label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {INK_COLORS.map(c => (
                    <button key={c.hex} title={c.label} onClick={() => setSettings({ ...settings, inkColor: c.hex })} style={{
                      width: 30, height: 30, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                      border: settings.inkColor === c.hex ? '2.5px solid var(--accent-purple)' : '2px solid transparent',
                      boxShadow: settings.inkColor === c.hex ? '0 0 0 3px rgba(108,99,255,0.3)' : 'none',
                      transition: 'all 0.18s',
                    }} />
                  ))}
                  <input type="color" value={settings.inkColor} title="Custom"
                    onChange={e => setSettings({ ...settings, inkColor: e.target.value })}
                    style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }} />
                </div>
              </motion.div>
            )}

            {activeTab === 'style' && (
              <motion.div key="style" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                <RangeRow label="Naturalness" value={`${Math.round(settings.imperfectionLevel * 100)}%`}>
                  <input type="range" min={0} max={1} step={0.05} value={settings.imperfectionLevel}
                    onChange={e => setSettings({ ...settings, imperfectionLevel: +e.target.value })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    <span>Perfect</span><span>Natural</span>
                  </div>
                </RangeRow>

                <RangeRow label="Slant Angle" value={`${settings.slantAngle > 0 ? '+' : ''}${settings.slantAngle}°`}>
                  <input type="range" min={-30} max={30} step={2} value={settings.slantAngle}
                    onChange={e => setSettings({ ...settings, slantAngle: +e.target.value })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    <span>← Back</span><span>Forward →</span>
                  </div>
                </RangeRow>

                <RangeRow label="Letter Spacing" value={`${settings.letterSpacing.toFixed(1)}×`}>
                  <input type="range" min={0.6} max={2.5} step={0.1} value={settings.letterSpacing}
                    onChange={e => setSettings({ ...settings, letterSpacing: +e.target.value })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                </RangeRow>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile hint */}
          {readyProfiles.length > 0 && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
              fontSize: '0.75rem', color: 'var(--accent-teal)',
            }}>
              ✦ Profile selected: style settings will be overridden by your handwriting model
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  );
}

function RangeRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label>{label}</Label>
        <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', fontWeight: 600 }}>{value}</span>
      </div>
      {children}
    </div>
  );
}
