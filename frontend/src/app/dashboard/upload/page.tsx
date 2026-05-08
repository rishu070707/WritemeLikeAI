'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const queryClient = useQueryClient();

  const { data: profilesData, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.getAll().then((r) => r.data),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const newFiles = acceptedFiles.filter((f) => !existing.has(f.name));
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name.');
      return;
    }
    try {
      const res = await profilesApi.create(newProfileName);
      setSelectedProfile(res.data.profile._id);
      setNewProfileName('');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(`Profile "${newProfileName}" created!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create profile.');
    }
  };

  const handleUpload = async () => {
    if (!selectedProfile) {
      toast.error('Please select or create a handwriting profile first.');
      return;
    }
    if (files.length === 0) {
      toast.error('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    try {
      await profilesApi.uploadSamples(selectedProfile, files);
      toast.success(`${files.length} file(s) uploaded successfully!`);
      setFiles([]);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTrain = async (profileId: string) => {
    setIsTraining(true);
    try {
      await profilesApi.train(profileId);
      toast.success('Training started! This may take a few minutes.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Training failed to start.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    try {
      await profilesApi.delete(profileId);
      toast.success('Profile deleted.');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (err: any) {
      toast.error('Failed to delete profile.');
    }
  };

  const profiles = profilesData?.profiles || [];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-amber',
      processing: 'badge-purple',
      ready: 'badge-green',
      failed: 'badge-red',
    };
    return map[status] || 'badge-amber';
  };

  const statusIcon = (status: string) => {
    const map: Record<string, string> = { pending: '⏳', processing: '🔄', ready: '✅', failed: '❌' };
    return map[status] || '⏳';
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          📤 Upload Handwriting Samples
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>
          Upload photos or PDFs of your handwriting. The AI will learn your exact style.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Left: Upload area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {/* Create profile */}
          <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
              1. Create Handwriting Profile
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input-field"
                placeholder='e.g. "My Natural Writing"'
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                style={{ flex: 1, fontSize: '0.9rem' }}
              />
              <button
                className="btn-primary"
                onClick={handleCreateProfile}
                style={{ padding: '11px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
              >
                + Create
              </button>
            </div>

            {/* Profile selector */}
            {profiles.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Or select existing:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {profiles.map((p: any) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedProfile(p._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: selectedProfile === p._id
                          ? '1px solid rgba(108,99,255,0.5)'
                          : '1px solid var(--border-subtle)',
                        background: selectedProfile === p._id ? 'rgba(108,99,255,0.12)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.sampleCount} sample(s)
                        </div>
                      </div>
                      <span className={`badge ${statusBadge(p.status)}`}>
                        {statusIcon(p.status)} {p.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dropzone */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
              2. Upload Handwriting Images
            </h3>

            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              style={{ marginBottom: files.length > 0 ? 16 : 0 }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
                {isDragActive ? '📂' : '📎'}
              </div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>
                {isDragActive ? 'Drop files here!' : 'Drag & drop files here'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                or click to browse · JPG, PNG, PDF · Max 20MB each
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Upload up to 10 files for best results
              </p>
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div style={{ marginBottom: 12 }}>
                    {files.map((file, i) => (
                      <div key={file.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        marginBottom: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{file.type.includes('pdf') ? '📄' : '🖼️'}</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{file.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setFiles(files.filter((_, fi) => fi !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedProfile}
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {isUploading ? '⟳ Uploading...' : `📤 Upload ${files.length} File(s)`}
                  </button>

                  {!selectedProfile && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', textAlign: 'center', marginTop: 8 }}>
                      ⚠️ Create or select a profile first
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Tips + profiles */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          {/* Tips */}
          <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
              💡 Tips for Best Results
            </h3>
            {[
              { icon: '📝', tip: 'Write naturally — don\'t try to write "perfectly"' },
              { icon: '💡', tip: 'Use good lighting so handwriting is clearly visible' },
              { icon: '📄', tip: 'Upload at least 3-5 pages for accurate style learning' },
              { icon: '🔤', tip: 'Include all letters a-z and A-Z if possible' },
              { icon: '📐', tip: 'Use white or light-colored paper for best contrast' },
              { icon: '📸', tip: 'Scan or photograph at 300+ DPI for clearest results' },
            ].map((item) => (
              <div key={item.tip} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.tip}</span>
              </div>
            ))}
          </div>

          {/* Profiles with train buttons */}
          {profiles.length > 0 && (
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
                3. Train Your Profile
              </h3>
              {profiles.map((p: any) => (
                <div key={p._id} style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 10,
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.sampleCount} sample(s) uploaded
                      </div>
                    </div>
                    <span className={`badge ${statusBadge(p.status)}`}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                  </div>

                  {p.status === 'ready' && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-teal)', marginBottom: 8 }}>
                      ✅ Ready to use in generator
                    </div>
                  )}

                  {p.status === 'processing' && (
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <motion.div
                        className="progress-bar-fill"
                        animate={{ width: ['30%', '80%', '30%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {p.sampleCount > 0 && p.status !== 'processing' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleTrain(p._id)}
                        disabled={isTraining}
                        style={{ padding: '7px 14px', fontSize: '0.8rem', flex: 1 }}
                      >
                        {p.status === 'ready' ? '🔄 Retrain' : '🚀 Start Training'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProfile(p._id)}
                      style={{
                        padding: '7px 12px', fontSize: '0.8rem',
                        background: 'rgba(255,80,80,0.1)',
                        border: '1px solid rgba(255,80,80,0.2)',
                        borderRadius: 8, cursor: 'pointer', color: '#ff6b6b',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
