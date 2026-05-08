'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { generateApi, profilesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PAGE_TYPES = [
  { id: 'blank', label: 'Blank', icon: '📄' },
  { id: 'lined', label: 'Lined', icon: '📃' },
  { id: 'double-lined', label: 'Double Lined', icon: '📋' },
  { id: 'ruled', label: 'Ruled', icon: '📓' },
  { id: 'grid', label: 'Grid', icon: '⊞' },
];

const PEN_TYPES = [
  { id: 'ballpoint', label: 'Ballpoint' },
  { id: 'fountain', label: 'Fountain' },
  { id: 'gel', label: 'Gel' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'marker', label: 'Marker' },
];

const INK_COLORS = [
  { hex: '#1a1a2e', label: 'Dark Blue' },
  { hex: '#0d0d0d', label: 'Black' },
  { hex: '#1a3a6e', label: 'Royal Blue' },
  { hex: '#1a5c1a', label: 'Green' },
  { hex: '#8b0000', label: 'Dark Red' },
  { hex: '#4a0080', label: 'Purple' },
];

export default function GeneratePage() {
  const [text, setText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [title, setTitle] = useState('');
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
    if (!text.trim()) {
      toast.error('Please enter some text to generate!');
      return;
    }
    if (text.length > 10000) {
      toast.error('Text is too long. Maximum 10,000 characters.');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setCurrentPage(0);

    try {
      const res = await generateApi.generate({
        text,
        profileId: selectedProfile || undefined,
        settings,
        title: title || undefined,
      });

      setResult(res.data.generation);
      toast.success(`Generated ${res.data.generation.output?.pageCount || 1} page(s)! 🎉`);
    } catch (err: any) {
      if (err.response?.data?.upgradeRequired) {
        toast.error('Generation limit reached. Upgrade to Pro for unlimited generations!');
      } else {
        toast.error(err.response?.data?.message || 'Generation failed. Make sure the AI service is running.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const readyProfiles = profilesData?.profiles?.filter((p: any) => p.status === 'ready') || [];

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          ✍️ Generate Handwriting
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>
          Type or paste your text and customize the handwriting style.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
        {/* Left: Text input + preview */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <input
              className="input-field"
              placeholder="Generation title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '0.9rem' }}
            />
          </div>

          {/* Text area */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Text to convert
              </label>
              <span style={{ fontSize: '0.78rem', color: text.length > 9000 ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
                {text.length.toLocaleString()} / 10,000
              </span>
            </div>
            <textarea
              id="generate-text"
              className="input-field"
              placeholder="Type or paste your text here...&#10;&#10;The AI will convert this into your handwriting style with natural imperfections, realistic spacing, and authentic pen movement simulation."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
              style={{
                minHeight: 260,
                resize: 'vertical',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* Profile selector */}
          {readyProfiles.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Handwriting Profile (optional)
              </label>
              <select
                className="input-field"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Generic Handwriting Style</option>
                {readyProfiles.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Generate button */}
          <button
            id="generate-btn"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginBottom: 24 }}
          >
            {isGenerating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  ⟳
                </motion.span>
                Generating handwriting... This may take 20-30 seconds
              </span>
            ) : '✍️ Generate Handwriting'}
          </button>

          {/* Loading indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ padding: 24, marginBottom: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: '2rem' }}
                >
                  🖊️
                </motion.div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>AI is writing your text...</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Applying your handwriting style, natural imperfections, and ink simulation
                  </div>
                </div>
              </div>
              {/* Animated progress steps */}
              {['Analyzing text', 'Applying style', 'Rendering pages', 'Generating PDF'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.4 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.85rem', color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: i * 0.4, duration: 0.3 }}
                  >
                    ✓
                  </motion.span>
                  {step}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Result preview */}
          <AnimatePresence>
            {result && result.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>
                    📄 Generated {result.output?.pageCount || 0} Page(s)
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {result.output?.pdfUrl && (
                      <button
                        className="btn-primary"
                        onClick={() => handleDownload(result.output.pdfUrl, `${result.title || 'handwriting'}.pdf`)}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        📥 Download PDF
                      </button>
                    )}
                    <button
                      className="btn-secondary"
                      onClick={handleGenerate}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                </div>

                {/* Page navigation */}
                {result.output?.pngUrls?.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Page {currentPage + 1} of {result.output.pngUrls.length}
                    </span>
                    <button
                      className="btn-ghost"
                      onClick={() => setCurrentPage(Math.min(result.output.pngUrls.length - 1, currentPage + 1))}
                      disabled={currentPage === result.output.pngUrls.length - 1}
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* Preview image */}
                {result.output?.pngUrls?.[currentPage] ? (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={result.output.pngUrls[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute', bottom: 16, right: 16,
                      display: 'flex', gap: 8,
                    }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleDownload(result.output.pngUrls[currentPage], `page-${currentPage + 1}.png`)}
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        📥 PNG
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass" style={{
                    padding: 60, textAlign: 'center',
                    fontSize: '0.9rem', color: 'var(--text-secondary)',
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>📄</div>
                    <p>PDF generated successfully!</p>
                    <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {result.output?.pageCount || 0} page(s) · Click Download PDF above
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Settings panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass"
          style={{ padding: 24, position: 'sticky', top: 20 }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>⚙️ Style Settings</h3>

          {/* Page type */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 10, color: 'var(--text-secondary)' }}>
              Page Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PAGE_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setSettings({ ...settings, pageType: pt.id })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: settings.pageType === pt.id
                      ? '1px solid rgba(108,99,255,0.6)'
                      : '1px solid var(--border-subtle)',
                    background: settings.pageType === pt.id
                      ? 'rgba(108,99,255,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    color: settings.pageType === pt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  {pt.icon} {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Writing Size
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min={12} max={48} step={2}
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
            />
          </div>

          {/* Pen type */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Pen Type
            </label>
            <select
              className="input-field"
              value={settings.penType}
              onChange={(e) => setSettings({ ...settings, penType: e.target.value })}
              style={{ fontSize: '0.85rem', padding: '9px 12px' }}
            >
              {PEN_TYPES.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* Ink color */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 10, color: 'var(--text-secondary)' }}>
              Ink Color
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {INK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => setSettings({ ...settings, inkColor: c.hex })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c.hex,
                    border: settings.inkColor === c.hex ? '2px solid var(--accent-purple)' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: settings.inkColor === c.hex ? '0 0 0 3px rgba(108,99,255,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
              <input
                type="color"
                value={settings.inkColor}
                onChange={(e) => setSettings({ ...settings, inkColor: e.target.value })}
                title="Custom color"
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  padding: 0,
                }}
              />
            </div>
          </div>

          {/* Imperfection level */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Naturalness
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                {Math.round(settings.imperfectionLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={settings.imperfectionLevel}
              onChange={(e) => setSettings({ ...settings, imperfectionLevel: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Perfect</span>
              <span>Natural</span>
            </div>
          </div>

          {/* Slant */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Slant Angle
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                {settings.slantAngle > 0 ? '+' : ''}{settings.slantAngle}°
              </span>
            </div>
            <input
              type="range"
              min={-30} max={30} step={2}
              value={settings.slantAngle}
              onChange={(e) => setSettings({ ...settings, slantAngle: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>← Backward</span>
              <span>Forward →</span>
            </div>
          </div>

          {/* Letter spacing */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Letter Spacing
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                {settings.letterSpacing.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5} max={2.5} step={0.1}
              value={settings.letterSpacing}
              onChange={(e) => setSettings({ ...settings, letterSpacing: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
            />
          </div>

          {/* Line spacing */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Line Spacing
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                {settings.lineSpacing.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={1.0} max={3.0} step={0.1}
              value={settings.lineSpacing}
              onChange={(e) => setSettings({ ...settings, lineSpacing: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
