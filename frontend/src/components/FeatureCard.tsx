'use client';

import { motion } from 'framer-motion';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export default function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass glass-hover"
      style={{ padding: 28, cursor: 'default' }}
    >
      <div style={{
        width: 56, height: 56,
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem',
        background: `linear-gradient(135deg, rgba(108,99,255,0.2), rgba(255,107,157,0.1))`,
        marginBottom: 20,
        border: '1px solid rgba(108,99,255,0.2)',
      }}>
        {feature.icon}
      </div>

      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10, color: 'var(--text-primary)' }}>
        {feature.title}
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {feature.description}
      </p>
    </motion.div>
  );
}
