import { PRIMARY, PURPLE } from '../../constants/colors';

export default function LandingScreen({ setMode, setLoginTab }) {
  return (
    <div style={styles.container}>
      <div style={styles.backgroundImage} />
      <div style={styles.content}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>🍽️</span>
        </div>
        <h1 style={styles.title}>
          DINESYNC
        </h1>
        <p style={styles.subtitle}>
          Restaurant Management System
        </p>
        <p style={styles.description}>
          Complete POS • Inventory • Analytics • Admin Panel
        </p>
        <div style={styles.cardContainer}>
          <Card
            icon="✨"
            title="Register Restaurant"
            desc="Partner with us"
            color="#10B981"
            onClick={() => setMode('register')}
          />
          <Card
            icon="🚴"
            title="Delivery Partner"
            desc="Join as Pandrapo"
            color="#f59e0b"
            onClick={() => setMode('partnerRegister')}
          />
          <Card
            icon="🧾"
            title="Cashier Panel"
            desc="POS, Orders, Reports"
            color={PRIMARY}
            onClick={() => { setLoginTab('employee'); setMode('adminLogin'); }}
          />
          <Card
            icon="⚙️"
            title="Admin Panel"
            desc="Dashboard, Analytics"
            color={PURPLE}
            onClick={() => { setLoginTab('admin'); setMode('adminLogin'); }}
          />
        </div>
        <p style={styles.footer}>
          RUCHI'S FAMILY RESTAURANT © 2026
        </p>
      </div>
    </div>
  );
}

function Card({ icon, title, desc, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ ...styles.cardBase, border: `2px solid ${color}` }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${color}44`;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={styles.cardIcon}>{icon}</div>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' },
  backgroundImage: { position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 },
  content: { position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' },
  iconContainer: { marginBottom: 8 },
  icon: { fontSize: 48, fontWeight: 900, letterSpacing: 4 },
  title: { fontSize: 48, fontWeight: 900, letterSpacing: 4, margin: 0, marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginBottom: 16, fontSize: 16 },
  description: { color: 'rgba(255,255,255,0.4)', marginBottom: 48, fontSize: 13 },
  cardContainer: { display: 'flex', gap: 24, justifyContent: 'center' },
  footer: { marginTop: 40, color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  cardBase: { background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '32px 40px', cursor: 'pointer', width: 200, transition: 'all 0.2s', backdropFilter: 'blur(10px)' },
  cardIcon: { fontSize: 48, marginBottom: 12 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' },
  cardDesc: { margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }
};
