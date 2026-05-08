'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div className="glow-orb glow-orb-purple" style={{ width: 400, height: 400, top: -100, left: -100 }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: 420, padding: '48px 40px', position: 'relative', zIndex: 1 }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>✍️</span>
          <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>Write<span className="gradient-text">LikeMe</span></span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>📧</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Check your email</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/auth/login">
              <button className="btn-secondary" style={{ width: '100%' }}>Back to Sign In</button>
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
              Forgot password?
            </h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 36, fontSize: '0.9rem' }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '14px' }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/auth/login" style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', textDecoration: 'none' }}>
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
