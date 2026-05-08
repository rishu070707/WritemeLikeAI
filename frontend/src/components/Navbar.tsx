'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 24px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(10, 10, 20, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.5rem' }}>✍️</span>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          Write<span className="gradient-text">LikeMe</span>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 600, marginLeft: 4 }}>AI</span>
      </Link>

      {/* Desktop Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
        {[
          { label: 'Features', href: '#features' },
          { label: 'Demo', href: '#demo' },
          { label: 'Pricing', href: '#pricing' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isAuthenticated ? (
          <>
            <Link href="/dashboard">
              <button className="btn-ghost">Dashboard</button>
            </Link>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-card)',
              borderRadius: 100,
              padding: '6px 16px 6px 8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: 'white',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
              <button
                className="btn-ghost"
                onClick={handleLogout}
                style={{ fontSize: '0.8rem', padding: '4px 8px', marginLeft: 4 }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <button className="btn-ghost">Sign In</button>
            </Link>
            <Link href="/auth/signup">
              <button className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
                Get Started Free
              </button>
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
