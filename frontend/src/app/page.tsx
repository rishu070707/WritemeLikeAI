'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroAnimation from '@/components/HeroAnimation';
import FeatureCard from '@/components/FeatureCard';
import PricingCard from '@/components/PricingCard';
import TestimonialCard from '@/components/TestimonialCard';

const FEATURES = [
  {
    icon: '🖊️',
    title: 'Upload Your Handwriting',
    description: 'Upload photos or PDFs of your handwriting. Our AI extracts your unique style — slant, spacing, stroke weight, and personality.',
    gradient: 'from-purple-500/20 to-pink-500/10',
  },
  {
    icon: '🧠',
    title: 'AI Style Learning',
    description: 'Advanced computer vision analyzes every nuance of your writing — baseline variance, ink flow, letter formation, and natural imperfections.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
  {
    icon: '📄',
    title: 'Realistic Generation',
    description: 'Type any text and watch it transform into pages that look exactly like YOUR handwriting — not a generic font. Real pen movement simulation.',
    gradient: 'from-teal-500/20 to-emerald-500/10',
  },
  {
    icon: '📥',
    title: 'Export Anywhere',
    description: 'Download as high-res PDF, PNG, or JPG. Print-ready quality. Multiple page types: lined, grid, blank, or custom templates.',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  {
    icon: '🎨',
    title: 'Full Customization',
    description: 'Choose ink color, pen type, page style, font size, imperfection level. Ballpoint, fountain, gel, pencil — all simulated.',
    gradient: 'from-pink-500/20 to-rose-500/10',
  },
  {
    icon: '⚡',
    title: 'Instant Preview',
    description: 'Real-time preview as you type. Zoom, navigate pages, download or regenerate in one click. Mobile-ready interface.',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Engineering Student', text: 'I upload my notes template once and now all my assignments look handwritten. Professors can\'t tell the difference!', avatar: 'AM' },
  { name: 'Priya Sharma', role: 'Content Creator', text: 'The handwriting quality is insane. It has all my little quirks — the way I cross my t\'s, my slightly tilted letters. It\'s genuinely MY handwriting.', avatar: 'PS' },
  { name: 'James Wilson', role: 'Novelist', text: 'Using this to create handwritten props for my book cover. The output is indistinguishable from real handwriting under professional photography.', avatar: 'JW' },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);

  const demoTexts = [
    "Dear diary, today was an ordinary day...",
    "Chemistry Notes: The periodic table shows...",
    "Shopping List: Milk, eggs, bread...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoTexts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-wrapper noise" style={{ overflowX: 'hidden' }}>
      {/* Glow orbs */}
      <div className="glow-orb glow-orb-purple" style={{ width: 600, height: 600, top: -200, left: -200, zIndex: 0 }} />
      <div className="glow-orb glow-orb-pink" style={{ width: 500, height: 500, top: 200, right: -150, zIndex: 0 }} />
      <div className="glow-orb glow-orb-teal" style={{ width: 400, height: 400, bottom: 200, left: '30%', zIndex: 0 }} />

      <Navbar />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span className="badge badge-purple" style={{ marginBottom: 24, display: 'inline-flex' }}>
              ✨ AI-Powered Handwriting Generation
            </span>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: '-0.03em',
            }}>
              Your words,{' '}
              <span className="gradient-text">your handwriting</span>
              <br />
              <span className="font-cursive" style={{ fontSize: '0.85em', opacity: 0.9 }}>
                — magically generated
              </span>
            </h1>

            <p style={{
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              maxWidth: 640,
              margin: '0 auto 48px',
              lineHeight: 1.7,
            }}>
              Upload a page of your handwriting. Our AI learns your exact style and converts
              any typed text into realistic handwritten pages — complete with natural imperfections,
              ink variation, and your unique personality.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
              <Link href="/auth/signup">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                >
                  Start Free — No Credit Card
                </motion.button>
              </Link>
              <Link href="#demo">
                <motion.button
                  className="btn-secondary"
                  whileHover={{ scale: 1.03 }}
                  style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                >
                  See It In Action ↓
                </motion.button>
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { value: '50K+', label: 'Pages Generated' },
                { value: '99%', label: 'Style Accuracy' },
                { value: '<30s', label: 'Generation Time' },
                { value: 'Free', label: 'To Start' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero animation / demo */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            style={{ marginTop: 80 }}
          >
            <HeroAnimation activeDemo={activeDemo} demoTexts={demoTexts} />
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <span className="badge badge-purple" style={{ marginBottom: 16, display: 'inline-flex' }}>
              🚀 What WriteLikeMe AI Does
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
              Everything you need for{' '}
              <span className="gradient-text">perfect handwriting</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
              A complete pipeline from sample upload to realistic handwritten PDF export.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo section ── */}
      <section id="demo" style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: 16 }}>
              See the difference
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Input text on the left. AI-generated handwriting on the right.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass"
            style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}
          >
            {/* Input side */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>
                📝 TYPED TEXT INPUT
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 20,
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                minHeight: 200,
              }}>
                {demoTexts[activeDemo]}
              </div>
            </div>

            {/* Output side */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>
                ✍️ AI HANDWRITTEN OUTPUT
              </div>
              <div style={{
                background: 'rgba(252, 251, 248, 0.08)',
                borderRadius: 12,
                padding: 20,
                minHeight: 200,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(252, 251, 248, 0.1)',
              }}>
                {/* Ruled lines */}
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: 40, right: 16,
                    top: 52 + i * 40,
                    height: 1,
                    background: 'rgba(100, 140, 200, 0.2)',
                  }} />
                ))}
                <div style={{
                  position: 'absolute', left: 40, top: 0, bottom: 0,
                  width: 2, background: 'rgba(220, 100, 100, 0.2)',
                }} />
                <p className="font-handwriting" style={{
                  fontSize: '1.6rem',
                  color: '#1a3a6e',
                  lineHeight: 2.5,
                  paddingLeft: 52,
                  paddingTop: 20,
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 1px 2px rgba(26, 58, 110, 0.3))',
                }}>
                  {demoTexts[activeDemo]}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: 16 }}>
              Simple, transparent <span className="gradient-text">pricing</span>
            </h2>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            maxWidth: 900,
            margin: '0 auto',
          }}>
            <PricingCard
              name="Free"
              price="$0"
              description="Try it out"
              features={['5 generations/month', '3 handwriting profiles', 'PDF & PNG export', 'Basic page templates', 'Email support']}
              ctaText="Get Started Free"
              ctaHref="/auth/signup"
              isFree
            />
            <PricingCard
              name="Pro"
              price="$12"
              description="For power users"
              features={['Unlimited generations', '20 handwriting profiles', 'All page templates', 'Custom templates upload', 'Priority AI processing', 'Signature generation', 'API access', 'Priority support']}
              ctaText="Start Pro Trial"
              ctaHref="/auth/signup?plan=pro"
              isPopular
            />
            <PricingCard
              name="Enterprise"
              price="$49"
              description="For teams"
              features={['Everything in Pro', 'Team collaboration', 'Custom model training', 'White-label exports', 'SSO / SAML', 'Dedicated support', 'SLA guarantee']}
              ctaText="Contact Sales"
              ctaHref="mailto:hello@writelikeme.ai"
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: 16 }}>
              What our users say
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass"
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '64px 48px',
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(255, 107, 157, 0.05) 100%)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginBottom: 16 }}>
            Ready to write{' '}
            <span className="gradient-text">like yourself?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 40 }}>
            Join thousands of students, writers, and creators. Your first 5 generations are free.
          </p>
          <Link href="/auth/signup">
            <motion.button
              className="btn-primary animate-pulse-glow"
              whileHover={{ scale: 1.05 }}
              style={{ fontSize: '1.1rem', padding: '16px 48px' }}
            >
              Create Your Free Account →
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>✍️</span>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>WriteLikeMe AI</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © 2024 WriteLikeMe AI. Built with ❤️ and a lot of pixels.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <a key={link} href="#" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
