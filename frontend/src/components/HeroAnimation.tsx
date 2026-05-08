'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeroAnimationProps {
  activeDemo: number;
  demoTexts: string[];
}

export default function HeroAnimation({ activeDemo, demoTexts }: HeroAnimationProps) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const currentText = demoTexts[activeDemo];

  // Typewriter effect for the handwriting animation
  useEffect(() => {
    setDisplayedChars(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedChars(i);
      if (i >= currentText.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [activeDemo, currentText]);

  return (
    <div style={{
      position: 'relative',
      maxWidth: 900,
      margin: '0 auto',
    }}>
      {/* Floating glow */}
      <div className="glow-orb glow-orb-purple animate-pulse-glow" style={{
        width: 300, height: 300,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        filter: 'blur(100px)',
      }} />

      {/* Mock notebook page */}
      <motion.div
        className="animate-float"
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(252, 251, 248, 0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(252, 251, 248, 0.12)',
          borderRadius: 20,
          padding: '48px 56px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          overflow: 'hidden',
          minHeight: 300,
        }}
      >
        {/* Paper texture lines */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 80, right: 32,
            top: 80 + i * 44,
            height: 1,
            background: 'rgba(100, 140, 200, 0.15)',
          }} />
        ))}

        {/* Red margin line */}
        <div style={{
          position: 'absolute',
          left: 80, top: 0, bottom: 0,
          width: 2,
          background: 'rgba(220, 80, 80, 0.2)',
        }} />

        {/* Animated handwriting text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeDemo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-handwriting"
            style={{
              fontSize: '2.2rem',
              color: '#1e3a6e',
              lineHeight: 2.75,
              paddingLeft: 48,
              paddingTop: 8,
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 2px 4px rgba(30, 58, 110, 0.3))',
            }}
          >
            {currentText.slice(0, displayedChars)}
            {displayedChars < currentText.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                style={{ display: 'inline-block', width: 2, height: '0.9em', background: '#6c63ff', verticalAlign: 'text-bottom', marginLeft: 2 }}
              />
            )}
          </motion.p>
        </AnimatePresence>

        {/* Page label */}
        <div style={{
          position: 'absolute',
          bottom: 16, right: 24,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.2)',
          fontFamily: 'monospace',
        }}>
          Page 1 of 1 · WriteLikeMe AI
        </div>

        {/* Pen cursor */}
        <motion.div
          style={{
            position: 'absolute',
            right: 40,
            top: 60,
            fontSize: '1.5rem',
            filter: 'drop-shadow(0 2px 8px rgba(108,99,255,0.6))',
          }}
          animate={{
            y: [0, 50, 100, 150, 100, 50, 0],
            x: [0, 20, -10, 30, -5, 10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🖊️
        </motion.div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          position: 'absolute',
          left: -20,
          top: 40,
          background: 'rgba(10, 10, 20, 0.9)',
          border: '1px solid rgba(108,99,255,0.4)',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(20px)',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🧠</span>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>AI Learning</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Style extracted</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0 }}
        style={{
          position: 'absolute',
          right: -20,
          bottom: 60,
          background: 'rgba(10, 10, 20, 0.9)',
          border: '1px solid rgba(0, 212, 170, 0.4)',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(20px)',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>✅</span>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600 }}>99.2% Match</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your exact style</div>
        </div>
      </motion.div>
    </div>
  );
}
