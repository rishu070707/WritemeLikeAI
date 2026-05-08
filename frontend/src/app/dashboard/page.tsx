'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { generateApi, profilesApi } from '@/lib/api';

export default function DashboardHome() {
  const { user } = useAuthStore();

  const { data: historyData } = useQuery({
    queryKey: ['history', 1],
    queryFn: () => generateApi.getHistory(1, 4).then((r) => r.data),
  });

  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.getAll().then((r) => r.data),
  });

  const stats = [
    { icon: '📄', label: 'Total Generations', value: user?.totalGenerations ?? 0, color: 'var(--accent-purple)' },
    { icon: '✍️', label: 'Handwriting Profiles', value: profilesData?.profiles?.length ?? 0, color: 'var(--accent-teal)' },
    { icon: '⚡', label: 'Generations Left', value: user?.plan === 'free' ? (user?.generationsLeft ?? 0) : '∞', color: 'var(--accent-amber)' },
    { icon: '🌟', label: 'Plan', value: user?.plan?.toUpperCase() || 'FREE', color: 'var(--accent-pink)' },
  ];

  return (
    <div style={{ padding: '40px 40px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40 }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ready to generate some handwriting?
        </p>
      </motion.div>

      {/* Quick action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.25) 0%, rgba(255,107,157,0.1) 100%)',
          border: '1px solid rgba(108,99,255,0.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 40px',
          marginBottom: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 8 }}>
            ✍️ Generate Handwriting Now
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
            Type any text and convert it to your handwriting style. Upload samples first to personalize the output.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/upload">
            <button className="btn-secondary">Upload Samples</button>
          </Link>
          <Link href="/dashboard/generate">
            <button className="btn-primary" style={{ padding: '12px 28px' }}>
              Start Generating →
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass glass-hover"
            style={{ padding: 20 }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent generations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recent Generations</h3>
          <Link href="/dashboard/history" style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {historyData?.generations?.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {historyData.generations.map((gen: any) => (
              <Link key={gen._id} href={`/dashboard/history/${gen._id}`} style={{ textDecoration: 'none' }}>
                <div className="glass glass-hover" style={{ padding: 16, cursor: 'pointer' }}>
                  {gen.output?.thumbnailUrl ? (
                    <img
                      src={gen.output.thumbnailUrl}
                      alt={gen.title}
                      style={{ width: '100%', borderRadius: 8, marginBottom: 12, objectFit: 'cover', height: 120 }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: 120, borderRadius: 8, marginBottom: 12,
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem',
                    }}>
                      📄
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gen.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {gen.output?.pageCount || 0} page(s) · {new Date(gen.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${gen.status === 'completed' ? 'badge-green' : gen.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                      {gen.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📝</div>
            <p style={{ marginBottom: 20 }}>No generations yet. Create your first one!</p>
            <Link href="/dashboard/generate">
              <button className="btn-primary">Generate Now</button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
