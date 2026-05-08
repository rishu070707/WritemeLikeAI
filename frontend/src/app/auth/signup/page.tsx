'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { signup, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      await signup(name, email, password);
      toast.success('Account created! Start generating handwriting 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', '#ff6b6b', '#ffb347', '#00d4aa'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

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
      <div className="glow-orb glow-orb-purple" style={{ width: 500, height: 500, top: -150, right: -100 }} />
      <div className="glow-orb glow-orb-teal" style={{ width: 400, height: 400, bottom: -100, left: -50 }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass"
        style={{ width: '100%', maxWidth: 460, padding: '48px 40px', position: 'relative', zIndex: 1 }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>✍️</span>
          <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>
            Write<span className="gradient-text">LikeMe</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', marginLeft: 4 }}>AI</span>
          </span>
        </Link>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          Create your account
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 36, fontSize: '0.9rem' }}>
          5 free generations — no credit card required
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: strength >= i ? strengthColors[strength] : 'var(--border-subtle)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: strengthColors[strength], marginTop: 4, display: 'block' }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: 20 }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⟳</span>
                Creating account...
              </span>
            ) : 'Create Free Account'}
          </button>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
            By signing up you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent-purple)' }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color: 'var(--accent-purple)' }}>Privacy Policy</a>.
          </p>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
