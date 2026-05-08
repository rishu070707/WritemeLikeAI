'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setIsSaving(true);
    try {
      // Profile update would go to backend
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>⚙️ Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>👤 Profile</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: 'white',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            <span className={`badge ${user?.plan === 'pro' ? 'badge-purple' : 'badge-amber'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
              {user?.plan?.toUpperCase()} Plan
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Display Name
          </label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleSaveName}
          disabled={isSaving}
          style={{ padding: '10px 24px', fontSize: '0.9rem' }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>

      {/* Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>💳 Subscription</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {user?.plan === 'free' ? 'Free Plan' : user?.plan === 'pro' ? 'Pro Plan' : 'Enterprise'}
            </div>
            {user?.plan === 'free' && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {user.generationsLeft} of 5 generations remaining this month
              </div>
            )}
            {user?.plan === 'pro' && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Unlimited generations · $12/mo</div>
            )}
          </div>
          <span className={`badge ${user?.plan === 'pro' ? 'badge-purple' : 'badge-amber'}`}>
            {user?.plan?.toUpperCase()}
          </span>
        </div>

        {user?.plan === 'free' && (
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,107,157,0.05))',
            border: '1px solid rgba(108,99,255,0.3)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Upgrade to Pro — $12/month</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Unlimited generations, 20 profiles, all templates, API access
            </p>
            <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
              Upgrade Now →
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>📊 Usage Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Total Generations', value: user?.totalGenerations ?? 0 },
            { label: 'Member Since', value: 'Recently' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass"
        style={{ padding: 28, borderColor: 'rgba(255,80,80,0.2)' }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: '#ff6b6b' }}>⚠️ Danger Zone</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={logout}
            className="btn-secondary"
            style={{ border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b' }}
          >
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
