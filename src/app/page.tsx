'use client';

import dynamic from 'next/dynamic';

const TruckMap = dynamic(() => import('@/components/map/TruckMap'), {
  ssr: false,
  loading: () => (
    <div style={styles.mapLoading}>
      <span style={styles.mapLoadingText}>Finding trucks near you...</span>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.page}>

        {/* ── Header ────────────────────────────────── */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.wordmark}>
              <span style={styles.wordmarkIcon}>🚚</span>
              <span style={styles.wordmarkText}>GoVendGo</span>
            </div>
            <nav style={styles.nav}>
              <a href="#how-it-works" style={styles.navLink}>How It Works</a>
              <a href="#for-trucks" style={styles.navLinkAccent}>For Vendors →</a>
            </nav>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────── */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <p style={styles.eyebrow}>Live · Lynnwood, WA</p>
            <h1 style={styles.headline}>
              Find the truck.<br />
              <em style={styles.headlineItalic}>Order ahead.</em>
            </h1>
            <p style={styles.subheadline}>
              Real-time GPS tracking and mobile ordering for the
              best food trucks near you.
            </p>
          </div>
        </section>

        {/* ── Map ───────────────────────────────────── */}
        <section style={styles.mapSection}>
          <div style={styles.mapWrapper}>
            <TruckMap clientSlug="marios-tacos" />
          </div>
          <p style={styles.mapCaption}>
            Tap any truck to browse the menu and order directly.
          </p>
        </section>

        {/* ── How It Works ──────────────────────────── */}
        <section id="how-it-works" style={styles.howSection}>
          <div style={styles.howInner}>
            <p style={styles.sectionEyebrow}>The Experience</p>
            <h2 style={styles.sectionHeading}>Three steps to your order.</h2>
            <div style={styles.steps}>
              {HOW_STEPS.map((step, i) => (
                <div key={i} style={styles.step}>
                  <div style={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={styles.stepIcon}>{step.icon}</div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepBody}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For Vendors CTA ───────────────────────── */}
        <section id="for-trucks" style={styles.ctaSection}>
          <div style={styles.ctaInner}>
            <p style={styles.sectionEyebrow}>For Operators</p>
            <h2 style={styles.ctaHeading}>
              Run your truck smarter.
            </h2>
            <p style={styles.ctaBody}>
              GoVendGo gives food truck owners a real-time GPS presence, mobile ordering,
              and Square-powered payments — all in one platform built for vendors on the go.
            </p>
            <a href="mailto:hello@govendgo.com" style={styles.ctaButton}>
              Get Early Access
            </a>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <span style={styles.footerWordmark}>🚚 GoVendGo</span>
            <span style={styles.footerCopy}>
              © {new Date().getFullYear()} GoVendGo · Lynnwood, WA
            </span>
            <span style={styles.footerTagline}>Built for the street.</span>
          </div>
        </footer>

      </div>
    </>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    icon: '📍',
    title: 'Find the truck',
    body: 'See every truck on the map in real time. GPS updates live so you always know exactly where to go.',
  },
  {
    icon: '📋',
    title: 'Order ahead',
    body: 'Browse the full menu, add items to your cart, and pay securely — all before you leave your seat.',
  },
  {
    icon: '🛵',
    title: 'Pick up fresh',
    body: 'Your order is waiting when you arrive. No line, no wait. Just great food.',
  },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#080f09',
  surface: '#0f180f',
  border: 'rgba(255,255,255,0.07)',
  white: '#f4f6f3',
  whiteMuted: 'rgba(244,246,243,0.55)',
  whiteFaint: 'rgba(244,246,243,0.25)',
  green: '#28a84a',
  greenLight: '#3ecf65',
  orange: '#e8621a',
  orangeLight: '#f07d38',
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${C.bg}; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fade-up-1 { animation: fadeUp 0.7s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
  .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: C.bg,
    fontFamily: "'DM Sans', sans-serif",
    color: C.white,
  },

  // Header
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: 'rgba(8,15,9,0.88)',
    backdropFilter: 'blur(12px)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  wordmarkIcon: {
    fontSize: '22px',
    lineHeight: 1,
  },
  wordmarkText: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '22px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: C.white,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: 400,
    color: C.whiteMuted,
    textDecoration: 'none',
    letterSpacing: '0.02em',
  },
  navLinkAccent: {
    fontSize: '14px',
    fontWeight: 500,
    color: C.orange,
    textDecoration: 'none',
    letterSpacing: '0.02em',
  },

  // Hero
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 32px 48px',
  },
  heroContent: {
    maxWidth: '640px',
  },
  eyebrow: {
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: C.green,
    marginBottom: '20px',
    animation: 'fadeUp 0.6s ease forwards',
  },
  headline: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(52px, 7vw, 84px)',
    fontWeight: 600,
    lineHeight: 1.05,
    color: C.white,
    marginBottom: '24px',
    animation: 'fadeUp 0.6s 0.1s ease both',
  },
  headlineItalic: {
    fontStyle: 'italic',
    color: C.orange,
    fontWeight: 400,
  },
  subheadline: {
    fontSize: '17px',
    fontWeight: 300,
    lineHeight: 1.65,
    color: C.whiteMuted,
    maxWidth: '480px',
    animation: 'fadeUp 0.6s 0.2s ease both',
  },

  // Map
  mapSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px 16px',
  },
  mapWrapper: {
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${C.border}`,
    height: '520px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
  },
  mapLoading: {
    height: '520px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderRadius: '16px',
  },
  mapLoadingText: {
    fontSize: '14px',
    color: C.whiteFaint,
    letterSpacing: '0.04em',
  },
  mapCaption: {
    marginTop: '12px',
    fontSize: '13px',
    color: C.whiteFaint,
    textAlign: 'center' as const,
    letterSpacing: '0.02em',
  },

  // How it works
  howSection: {
    borderTop: `1px solid ${C.border}`,
    marginTop: '80px',
    padding: '96px 32px',
  },
  howInner: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionEyebrow: {
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: C.green,
    marginBottom: '16px',
  },
  sectionHeading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(36px, 4vw, 52px)',
    fontWeight: 600,
    color: C.white,
    marginBottom: '64px',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '2px',
  },
  step: {
    padding: '40px 36px',
    backgroundColor: C.surface,
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  stepNumber: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: C.green,
    opacity: 0.8,
  },
  stepIcon: {
    fontSize: '28px',
    marginBottom: '4px',
  },
  stepTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '24px',
    fontWeight: 600,
    color: C.white,
    letterSpacing: '0.01em',
  },
  stepBody: {
    fontSize: '15px',
    fontWeight: 300,
    lineHeight: 1.65,
    color: C.whiteMuted,
  },

  // CTA section
  ctaSection: {
    borderTop: `1px solid ${C.border}`,
    padding: '96px 32px',
    background: `linear-gradient(135deg, rgba(40,168,74,0.07) 0%, rgba(232,98,26,0.05) 100%)`,
  },
  ctaInner: {
    maxWidth: '680px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  ctaHeading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(36px, 4vw, 56px)',
    fontWeight: 600,
    color: C.white,
    marginBottom: '20px',
    lineHeight: 1.1,
  },
  ctaBody: {
    fontSize: '16px',
    fontWeight: 300,
    lineHeight: 1.7,
    color: C.whiteMuted,
    marginBottom: '40px',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '14px 36px',
    backgroundColor: C.orange,
    color: '#ffffff',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textDecoration: 'none',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  },

  // Footer
  footer: {
    borderTop: `1px solid ${C.border}`,
    padding: '32px',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  footerWordmark: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '16px',
    fontWeight: 600,
    color: C.white,
    letterSpacing: '0.04em',
  },
  footerCopy: {
    fontSize: '13px',
    color: C.whiteFaint,
  },
  footerTagline: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: C.orange,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    opacity: 0.8,
  },
};