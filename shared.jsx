/* LEX AI marketing — shared components */

const { useEffect, useRef, useState } = React;

/* ---------- Icon ---------- */
const MIcon = ({ name, size = 16, stroke = 1.6 }) => {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'scales': return (
      <svg {...c}>
        <path d="M12 3v18" />
        <path d="M5 21h14" />
        <path d="M5 6h14" />
        <path d="M5 6l-3 7a3 3 0 0 0 6 0L5 6z" />
        <path d="M19 6l-3 7a3 3 0 0 0 6 0L19 6z" />
        <circle cx="12" cy="3.4" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
    case 'lock': return (
      <svg {...c}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
    case 'book': return (
      <svg {...c}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M4 19.5V21h16" />
      </svg>
    );
    case 'users': return (
      <svg {...c}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
    case 'chat': return (
      <svg {...c}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
    case 'file-doc': return (
      <svg {...c}>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8M8 17h6" />
      </svg>
    );
    case 'folder': return (
      <svg {...c}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    );
    case 'calendar': return (
      <svg {...c}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
    case 'shield': return (
      <svg {...c}>
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
    case 'search': return (
      <svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
    );
    case 'check': return (
      <svg {...c}><path d="M20 6L9 17l-5-5" /></svg>
    );
    case 'arrow-right': return (
      <svg {...c}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
    );
    case 'arrow-down': return (
      <svg {...c}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
    );
    case 'download': return (
      <svg {...c}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
    );
    case 'globe': return (
      <svg {...c}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
    case 'rss': return (
      <svg {...c}>
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
    case 'cpu': return (
      <svg {...c}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </svg>
    );
    case 'briefcase': return (
      <svg {...c}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
    case 'sparkles': return (
      <svg {...c}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    );
    case 'menu': return (
      <svg {...c}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    );
    case 'x': return (
      <svg {...c}><path d="M18 6L6 18M6 6l12 12" /></svg>
    );
    case 'plus': return (
      <svg {...c}><path d="M12 5v14M5 12h14" /></svg>
    );
    case 'minus': return (
      <svg {...c}><path d="M5 12h14" /></svg>
    );
    case 'external': return (
      <svg {...c}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6M10 14L21 3" />
      </svg>
    );
    case 'copy': return (
      <svg {...c}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    );
    case 'mail': return (
      <svg {...c}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 7l10 6 10-6" />
      </svg>
    );
    case 'credit-card': return (
      <svg {...c}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </svg>
    );
    case 'check-circle': return (
      <svg {...c}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    );
    case 'circle-dash': return (
      <svg {...c}>
        <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      </svg>
    );
    case 'alert': return (
      <svg {...c}>
        <path d="M12 2L1 21h22z" />
        <path d="M12 9v5M12 17.5v.5" />
      </svg>
    );
    case 'play': return (
      <svg {...c}><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" /></svg>
    );
    case 'gavel': return (
      <svg {...c}>
        <path d="M14 2l8 8-3 3-8-8z" />
        <path d="M11 5l-9 9 3 3 9-9" />
        <path d="M2 22h12" />
      </svg>
    );
    default: return null;
  }
};

/* ---------- Logo ---------- */
const Logo = ({ size = 'sm', pulse = false }) => (
  <div className={`logo-mark ${size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : ''} ${pulse ? 'pulse' : ''}`}>
    <MIcon name="scales" size={size === 'xl' ? 64 : size === 'lg' ? 44 : 20} stroke={1.4} />
  </div>
);

const Wordmark = ({ className = '' }) => (
  <div className={`wordmark ${className}`}>LEX<b>·</b>AI</div>
);

/* ---------- Navigation ---------- */
const Nav = ({ active }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { id: 'functionalitati', label: 'Funcționalități', href: 'functionalitati.html' },
    { id: 'ajutor',          label: 'Ajutor',          href: 'ajutor.html' },
    { id: 'preturi',         label: 'Prețuri',         href: 'preturi.html' },
    { id: 'descarcare',      label: 'Descarcă',        href: 'descarcare.html' },
  ];

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="/" className="nav-brand">
          <div className="logo-mark"><MIcon name="scales" size={20} stroke={1.4} /></div>
          <span className="word">LEX<b>·</b>AI</span>
        </a>
        <div className="nav-links">
          {links.map(l => (
            <a key={l.id} href={l.href} className={active === l.id ? 'active' : ''}>{l.label}</a>
          ))}
        </div>
        <div className="nav-cta">
          <a href="/descarcare" className="btn btn-primary btn-sm">
            <MIcon name="download" size={13} /> Trial 30 zile
          </a>
        </div>
      </div>
    </nav>
  );
};

/* ---------- Footer ---------- */
const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <a href="/" className="nav-brand">
            <div className="logo-mark"><MIcon name="scales" size={20} stroke={1.4} /></div>
            <span className="word">LEX<b>·</b>AI</span>
          </a>
          <p className="tagline">Asistentul juridic AI pentru cabinetul de avocatură. Construit pentru jurisprudența română.</p>
        </div>
        <div className="footer-col">
          <h5>Produs</h5>
          <ul>
            <li><a href="/functionalitati">Funcționalități</a></li>
            <li><a href="/preturi">Prețuri</a></li>
            <li><a href="/descarcare">Descarcă</a></li>
            <li><a href="ajutor.html#legi">Legi acoperite</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Resurse</h5>
          <ul>
            <li><a href="/ajutor">Documentație</a></li>
            <li><a href="ajutor.html#faq">Întrebări frecvente</a></li>
            <li><a href="ajutor.html#agenti">Ghid agenți</a></li>
            <li><a href="ajutor.html#confidentialitate">Confidențialitate</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Companie</h5>
          <ul>
            <li><a href="mailto:contact@lexai.ro">Contact</a></li>
            <li><a href="#">Politica de confidențialitate</a></li>
            <li><a href="#">Termeni și condiții</a></li>
            <li><a href="#">GDPR</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>CONSTRUIT PENTRU AVOCATURA ROMÂNĂ · LEX AI v1.0</span>
        <span>PREȚURI FĂRĂ TVA · ANTHROPIC API NECESARĂ SEPARAT</span>
      </div>
    </div>
  </footer>
);

/* ---------- Reveal-on-scroll wrapper ---------- */
const Reveal = ({ children, delay = 0, as: Tag = 'div', ...rest }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => el.classList.add('in'), delay);
        obs.disconnect();
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <Tag ref={ref} className={`reveal ${rest.className || ''}`} {...rest}>{children}</Tag>;
};

window.MIcon = MIcon;
window.Logo = Logo;
window.Wordmark = Wordmark;
window.Nav = Nav;
window.Footer = Footer;
window.Reveal = Reveal;
