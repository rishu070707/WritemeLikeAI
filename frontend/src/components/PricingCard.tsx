'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isPopular?: boolean;
  isFree?: boolean;
}

export default function PricingCard({
  name, price, description, features, ctaText, ctaHref, isPopular, isFree,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{
        position: 'relative',
        background: isPopular
          ? 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(255,107,157,0.08) 100%)'
          : 'var(--bg-card)',
        border: isPopular ? '1px solid rgba(108,99,255,0.5)' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 28px',
        backdropFilter: 'blur(20px)',
      }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          <span className="badge badge-purple" style={{ whiteSpace: 'nowrap' }}>
            ⭐ Most Popular
          </span>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{price}</span>
          {!isFree && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/month</span>}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
      </div>

      <Link href={ctaHref} style={{ display: 'block', marginBottom: 28 }}>
        <button
          className={isPopular ? 'btn-primary' : 'btn-secondary'}
          style={{ width: '100%', fontSize: '0.95rem' }}
        >
          {ctaText}
        </button>
      </Link>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((feature) => (
          <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent-teal)', fontSize: '0.9rem', flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
