'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back! ✍️');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="glow-orb glow-orb-purple" style={{ width: 500, height: 500, top: -100, left: -100 }} />
      <div className="glow-orb glow-orb-pink" style={{ width: 400, height: 400, bottom: -100, right: -100 }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '48px 40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>✍️</span>
          <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>
            Write<span className="gradient-text">LikeMe</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', marginLeft: 4 }}>AI</span>
          </span>
        </Link>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 36, fontSize: '0.9rem' }}>
          Sign in to continue generating handwriting
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
                  color: 'var(--text-muted)',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 28 }}>
            <Link href="/auth/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: 24 }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⟳</span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
