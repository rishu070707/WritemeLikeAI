'use client';

import { motion } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
}

export default function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass glass-hover"
      style={{ padding: 28 }}
    >
      <div style={{ color: 'var(--accent-purple)', fontSize: '1.5rem', marginBottom: 12 }}>
        ★★★★★
      </div>
      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        marginBottom: 20,
        fontStyle: 'italic',
      }}>
        "{testimonial.text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0,
        }}>
          {testimonial.avatar}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{testimonial.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{testimonial.role}</div>
        </div>
      </div>
    </motion.div>
  );
}
