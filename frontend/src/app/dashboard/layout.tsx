'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/generate', icon: '✍️', label: 'Generate' },
  { href: '/dashboard/upload', icon: '📤', label: 'Upload Samples' },
  { href: '/dashboard/history', icon: '📋', label: 'History' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout, fetchMe } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else {
      fetchMe();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: 240,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>✍️</span>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              Write<span className="gradient-text">LikeMe</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: '20px 12px', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <span style={{
                      marginLeft: 'auto',
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent-purple)',
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Plan badge */}
        <div style={{ padding: '0 12px 16px' }}>
          <div className="glass" style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Plan</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge ${user?.plan === 'pro' ? 'badge-purple' : 'badge-amber'}`}>
                {user?.plan?.toUpperCase() || 'FREE'}
              </span>
              {user?.plan === 'free' && (
                <Link href="/pricing" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', textDecoration: 'none' }}>
                  Upgrade →
                </Link>
              )}
            </div>
            {user?.plan === 'free' && (
              <>
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user.generationsLeft} generations left
                </div>
                <div className="progress-bar" style={{ marginTop: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${(user.generationsLeft / 5) * 100}%` }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}
            >
              🚪
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
