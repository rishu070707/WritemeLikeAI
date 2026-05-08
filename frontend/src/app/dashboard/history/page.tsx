'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['history', page],
    queryFn: () => generateApi.getHistory(page, 12).then((r) => r.data),
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this generation?')) return;
    try {
      await generateApi.delete(id);
      toast.success('Generation deleted.');
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      await generateApi.toggleFavorite(id);
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch {
      toast.error('Failed to update.');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { completed: 'badge-green', failed: 'badge-red', processing: 'badge-purple', pending: 'badge-amber' };
    return map[status] || 'badge-amber';
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
              📋 Generation History
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              All your past handwriting generations
            </p>
          </div>
          <Link href="/dashboard/generate">
            <button className="btn-primary">+ New Generation</button>
          </Link>
        </div>
      </motion.div>

      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 16 }} />
          ))}
        </div>
      ) : data?.generations?.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            {data.generations.map((gen: any, i: number) => (
              <motion.div
                key={gen._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-hover"
                style={{ overflow: 'hidden' }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative' }}>
                  {gen.output?.thumbnailUrl ? (
                    <img
                      src={gen.output.thumbnailUrl}
                      alt={gen.title}
                      style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: 160,
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '3rem',
                    }}>
                      📄
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    display: 'flex', gap: 6,
                  }}>
                    <button
                      onClick={() => handleFavorite(gen._id)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(10,10,20,0.8)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      {gen.isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button
                      onClick={() => handleDelete(gen._id)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(255,80,80,0.8)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', color: 'white',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gen.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    {new Date(gen.createdAt).toLocaleString()} · {gen.output?.pageCount || 0}p
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge ${statusBadge(gen.status)}`} style={{ fontSize: '0.7rem' }}>
                      {gen.status}
                    </span>
                    {gen.output?.pdfUrl && (
                      <a
                        href={gen.output.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--accent-purple)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        📥 PDF
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination?.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{ padding: '8px 20px' }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page {page} of {data.pagination.pages}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                disabled={page === data.pagination.pages}
                style={{ padding: '8px 20px' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass" style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>📝</div>
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>No generations yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Create your first handwriting generation to see it here.
          </p>
          <Link href="/dashboard/generate">
            <button className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
              Generate Now →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
