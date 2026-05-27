/* LEX AI help — sidebar nav, scrollspy, agent docs, FAQ list */
const { useState: useStateH, useEffect: useEffectH, useRef: useRefH } = React;
const HIcon = window.MIcon;
const HNav = window.Nav;
const HFooter = window.Footer;

ReactDOM.createRoot(document.getElementById('nav-root')).render(<HNav active="ajutor" />);
ReactDOM.createRoot(document.getElementById('footer-root')).render(<HFooter />);

/* ============== Sidebar nav with scrollspy ============== */
const NAV_GROUPS = [
  {
    title: 'Început',
    items: [
      { id: 'introducere', label: 'Introducere' },
      { id: 'ce-este', label: 'Ce este LEX AI?', sub: true },
      { id: 'cerinte', label: 'Cerințe de sistem', sub: true },
      { id: 'primii-pasi', label: 'Primii pași', sub: true },
    ],
  },
  {
    title: 'Configurare',
    items: [
      { id: 'configurare', label: 'Configurare inițială' },
      { id: 'cheie-api', label: 'Cheia API Anthropic', sub: true },
      { id: 'profil-firma', label: 'Profilul cabinetului', sub: true },
      { id: 'primul-agent', label: 'Primul agent', sub: true },
    ],
  },
  {
    title: 'Agenți',
    items: [
      { id: 'agenti', label: 'Agenți juridici' },
      { id: 'cum-functioneaza', label: 'Cum funcționează', sub: true },
      { id: 'tipuri-agenti', label: 'Cei 9 agenți', sub: true },
      { id: 'agent-custom', label: 'Agent custom', sub: true },
      { id: 'mod-activ', label: 'Mod ACTIV', sub: true },
      { id: 'mod-orchestrat', label: 'Mod ORCHESTRAT', sub: true },
      { id: 'limite-sfaturi', label: 'Limite și sfaturi', sub: true },
    ],
  },
  {
    title: 'Conținut',
    items: [
      { id: 'corpus', label: 'Corpus juridic' },
      { id: 'documente', label: 'Documente și fișiere' },
      { id: 'dosare', label: 'Dosare' },
      { id: 'agenda', label: 'Agenda' },
    ],
  },
  {
    title: 'Administrare',
    items: [
      { id: 'setari', label: 'Setări' },
      { id: 'confidentialitate', label: 'Confidențialitate' },
      { id: 'faq', label: 'FAQ' },
      { id: 'legi', label: 'Legi acoperite' },
    ],
  },
];

const HelpSidebar = () => {
  const [active, setActive] = useStateH('introducere');

  useEffectH(() => {
    const allIds = NAV_GROUPS.flatMap(g => g.items.map(i => i.id));
    const elems = allIds.map(id => document.getElementById(id)).filter(Boolean);
    if (!elems.length) return;

    const onScroll = () => {
      const offset = 120;
      let current = elems[0].id;
      for (const el of elems) {
        if (el.getBoundingClientRect().top - offset <= 0) {
          current = el.id;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {NAV_GROUPS.map(g => (
        <div key={g.title}>
          <h4>{g.title}</h4>
          {g.items.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`${item.sub ? 'sub' : ''} ${active === item.id ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('help-sidebar')).render(<HelpSidebar />);

/* ============== Agent documentation ============== */
const AGENT_DOCS = [
  {
    id: 'penal', initial: 'P', name: 'Avocat Penal',
    domain: 'Cod Penal L.286/2009 · CPP L.135/2010 · L.78/2000 · L.656/2002',
    desc: 'Drept penal substanțial și procedural. Plângeri penale, denunțuri, contestații măsuri preventive, strategii apărare, calcul termene prescripție și procesuale.',
    examples: [
      'Analizează rechizitoriul atașat și identifică viciile de procedură.',
      'Redactează o contestație la măsura arestării preventive — clientul are 56 ani, fără antecedente, fapta este înșelăciune fără violență.',
      'Care e termenul de prescripție pentru infracțiunea de tâlhărie calificată și de când curge?',
      'Compară încadrarea juridică propusă cu jurisprudența recentă ICCJ pe acest tip de speță.',
    ],
    escalate: 'Pentru capătul civil sau prejudiciul material → Avocat Civil. Pentru calculul prejudiciului fiscal cauzat statului → Drept Fiscal. Pentru jurisprudență consolidată → Cercetare Juridică (Opus).',
  },
  {
    id: 'civil', initial: 'C', name: 'Avocat Civil',
    domain: 'Cod Civil L.287/2009 · CPC L.134/2010 · OG 21/1992 (consumator)',
    desc: 'Drept civil și procedură civilă. Contracte, răspundere delictuală și contractuală, succesiuni, obligații, prescripție. Cereri de chemare în judecată, întâmpinări, cereri reconvenționale.',
    examples: [
      'Redactează o cerere de chemare în judecată pentru recuperarea creanței de 47.500 lei (factură neachitată din mai 2025).',
      'Analizează contractul de vânzare-cumpărare atașat — identifică clauze abuzive și riscuri pentru cumpărător.',
      'Care e termenul de prescripție pentru acțiunea în răspundere delictuală pentru un prejudiciu produs în 2023?',
      'Calculează dobânzi legale + penalitățile pentru o creanță de 32.000 lei scadentă acum 8 luni.',
    ],
    escalate: 'Pentru aspecte fiscale ale contractelor → Drept Fiscal. Pentru tranzacții imobiliare → Drept Imobiliar. Pentru divorț / succesiune între soți → Drept Familie.',
  },
  {
    id: 'imobil', initial: 'I', name: 'Drept Imobiliar',
    domain: 'L.7/1996 (cadastru) · L.17/2014 (terenuri agricole) · L.50/1991 (autorizări) · L.196/2018',
    desc: 'Tranzacții imobiliare, carte funciară, urbanism, retrocedări. Analiză extrase CF (sarcini, ipoteci, dezmembrăminte), antecontracte, contracte vânzare, autorizații construire.',
    examples: [
      'Verifică extrasul CF atașat — identifică sarcini, riscuri, mențiuni problematice pentru cumpărător.',
      'Redactează un antecontract de vânzare-cumpărare pentru apartament 3 camere — preț 145.000 EUR, avans 20%.',
      'Clientul vrea să cumpere teren agricol în zona suburbană — care sunt obligațiile de comunicare către arendaș și ANIF?',
      'Este nevoie de autorizație de construire pentru o pergolă de 25mp în zona neprotejată? Cod CAEN și încadrare.',
    ],
    escalate: 'Pentru aspecte fiscale ale tranzacției (impozit, TVA) → Drept Fiscal. Pentru moșteniri cu bunuri imobile → Drept Familie. Pentru autorizații contestate la primărie → Drept Administrativ.',
  },
  {
    id: 'comercial', initial: 'M', name: 'Drept Comercial',
    domain: 'L.31/1990 (societăți) · L.85/2014 (insolvență) · L.193/2000 (clauze abuzive B2B)',
    desc: 'Dreptul afacerilor — constituire și modificare societăți, AGA, cesiuni părți sociale, fuziuni-divizări, insolvență, M&A due diligence, contracte comerciale.',
    examples: [
      'Clientul vrea să cesioneze 60% din părțile sale dintr-un SRL. Ce pași și ce acte sunt necesare?',
      'Redactează un act constitutiv pentru SRL cu 2 asociați, capital social 5.000 lei, obiect IT consultanță.',
      'Procedura simplificată de insolvență — sub ce prag de creanțe? Termenele pentru cererea creditorului.',
      'Due diligence pentru achiziție 100% SRL — ce verificări obligatorii la ONRC, ANAF, ITM?',
    ],
    escalate: 'Pentru aspecte fiscale ale operațiunilor (cesiune, fuziune) → Drept Fiscal. Pentru aspecte de drept al muncii (transfer personal) → consultă agent custom pentru drept muncă.',
  },
  {
    id: 'familie', initial: 'F', name: 'Drept Familie',
    domain: 'Cod Civil Cartea II · L.272/2004 (protecția copilului) · L.217/2003 (violență domestică)',
    desc: 'Divorț (consensual și contencios), partaj, custodie, pensie de întreținere, adopție, ordonanțe de protecție, succesiuni între soți.',
    examples: [
      'Cum calculez pensia de întreținere pentru 2 copii minori, tatăl având venit net 6.500 lei/lună?',
      'Divorț prin acord — soții au un copil de 12 ani. Ce instanță și ce documente?',
      'Redactează o ordonanță de protecție pentru victima violenței domestice — fapte: amenințări și agresiune fizică din ultimele 30 zile.',
      'Care e procedura pentru adopția copilului partenerului (părinte vitreg)?',
    ],
    escalate: 'Pentru bunuri imobile din masa partajabilă → Drept Imobiliar. Pentru aspecte fiscale ale partajului → Drept Fiscal. Pentru încuviințarea minorului în acte civile → consultanță separată.',
  },
  {
    id: 'fiscal', initial: '€', name: 'Drept Fiscal',
    domain: 'Cod Fiscal L.227/2015 · Cod Proc. Fiscală L.207/2015 · L.241/2005 (evaziune)',
    desc: 'TVA, impozit profit / venit / dividende, taxe locale, ANAF inspecții, contestații decizii impunere, eșalonări, contencios fiscal, evaziune fiscală.',
    examples: [
      'Decizie de impunere de la ANAF cu 142.000 lei TVA suplimentar. Pași și termene pentru contestație.',
      'Calculează impozitul pe câștigul din cesiunea de părți sociale — cesiune 60.000 lei, cost achiziție 10.000 lei.',
      'Redactează o cerere de eșalonare la plată pentru creanță fiscală de 87.000 lei cu garanție bancară.',
      'Acțiune în contencios fiscal — competență Tribunal sau Curte de Apel pentru sumă de 1,2 milioane lei?',
    ],
    escalate: 'Pentru aspecte penale (evaziune fiscală art. 9 L.241/2005) → Avocat Penal. Pentru contestații la procese-verbale ITM → Drept Administrativ. Pentru contestații la ONRC privind înregistrări fiscale → Drept Comercial.',
  },
  {
    id: 'admin', initial: 'A', name: 'Drept Administrativ',
    domain: 'L.554/2004 (contencios) · L.98/2016 (achiziții) · L.101/2016 (CNSC) · OG 27/2002 (petiții)',
    desc: 'Contencios administrativ — anularea actelor administrative, obligarea autorităților, daune. Achiziții publice — CNSC, contestații. Autorizații, retrocedări, exproprieri.',
    examples: [
      'Primăria refuză autorizația de construire fără motivare. Plângere prealabilă sau direct instanța?',
      'Redactează o contestație CNSC împotriva anulării ofertei pe motiv de neconformitate formală.',
      'Procedura plângerii prealabile — termene, conținut obligatoriu, cum se redactează corect.',
      'Acțiune în anulare act administrativ + obligare emitere act + daune — capete de cerere obligatorii.',
    ],
    escalate: 'Pentru achiziții cu suspiciune de favorizare → Avocat Penal. Pentru contestații fiscale → Drept Fiscal. Pentru expropriere cu obiect imobiliar → Drept Imobiliar.',
  },
  {
    id: 'redactor', initial: 'R', name: 'Redactor Documente',
    domain: 'Toate tipurile de documente juridice românești',
    desc: 'Specialist în redactarea documentelor juridice — contracte, cereri, somații, notificări, procuri, hotărâri AGA. Asigură coerența terminologică, diacriticile corecte, numerotarea ierarhică. Marchează câmpurile variabile cu [PARANTEZE DREPTE].',
    examples: [
      'Redactează o notificare de punere în întârziere pentru recuperare creanță 47.500 lei (factură neachitată).',
      'Procură specială pentru reprezentare în fața ANAF în contestație — împuternicire pe articole concrete.',
      'Convenție de partaj voluntar — masă partajabilă: apartament, autoturism, depozit bancar 80.000 lei.',
      'Hotărâre AGA aprobare cesiune părți sociale 60% asociat unic către terț.',
    ],
    escalate: 'Pentru fundamentare juridică sau strategie → agentul de ramură (Penal, Civil etc.). Pentru cercetare comparativă pe spețe → Cercetare Juridică.',
  },
  {
    id: 'cercetare', initial: '⊕', name: 'Cercetare Juridică', opus: true,
    domain: 'claude-opus-4-7 · cel mai capabil model · analize aprofundate',
    desc: 'Folosit pentru memo-uri structurate (speță → norme → jurisprudență → doctrină → concluzie). Compară soluții jurisprudențiale divergente. Citează articolele exacte din corpus. Cost mai mare per întrebare — folosește când ai nevoie de adâncime.',
    examples: [
      'Există jurisprudență ICCJ recentă privind admisibilitatea probelor obținute prin interceptare în lipsa autorizării judecătorului?',
      'Memo comparativ: clauza de neconcurență în contractele individuale de muncă vs. contractele de prestări servicii — limite, jurisprudență, riscuri.',
      'Compară soluții CCR și ICCJ pe aplicarea legii penale mai favorabile — există divergență doctrinară?',
      'Analizează posibilitatea aplicării directe a unei directive UE neimplementate corect — cadru CJUE și consecințe practice.',
    ],
    escalate: 'Folosește alți agenți pentru implementarea practică (redactare, calcule, comunicări). Cercetarea oferă fundamentul, nu drafting-ul.',
  },
];

const AgentDoc = ({ agent }) => {
  const [open, setOpen] = useStateH(false);
  return (
    <div className={`agent-doc ${open ? 'open' : ''}`}>
      <button className="agent-doc-head" onClick={() => setOpen(!open)}>
        <div className={`ring-sm ${agent.opus ? 'opus' : ''}`}>{agent.initial}</div>
        <div className="ad-meta">
          <div className="ad-name">{agent.name}</div>
          <div className="ad-domain">{agent.domain}</div>
        </div>
        <div className="toggle"><HIcon name="plus" size={16} stroke={2} /></div>
      </button>
      <div className="agent-doc-body">
        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>{agent.desc}</p>
        <h5>Exemple de utilizare</h5>
        {agent.examples.map((ex, i) => (
          <div key={i} className="ex-prompt">{ex}</div>
        ))}
        <h5>Când să escaladezi la alt agent</h5>
        <p style={{ marginBottom: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>{agent.escalate}</p>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('agents-doc-root')).render(
  <>{AGENT_DOCS.map(a => <AgentDoc key={a.id} agent={a} />)}</>
);

/* ============== FAQ ============== */
const HELP_FAQ = [
  {
    q: 'Cât costă utilizarea API Anthropic?',
    a: 'API-ul este separat de licența LEX AI. Plătești Anthropic direct pe baza utilizării. Estimare pentru un cabinet de avocatură cu utilizare normală: €10-40 / lună. Claude Haiku (rezumate documente) este foarte ieftin; Claude Sonnet (chat curent) este moderat; Claude Opus (cercetare juridică) este premium. Tarifele actualizate la anthropic.com/pricing.',
  },
  {
    q: 'Pot folosi aplicația fără internet?',
    a: 'Parțial. Corpusul juridic și documentele indexate sunt locale — funcționează offline pentru căutare. Conversațiile AI necesită internet (API Anthropic). Monitorul Oficial RSS necesită internet. Backup-urile sunt locale (offline).',
  },
  {
    q: 'Datele mele ajung la Anthropic?',
    a: 'Textul conversațiilor și articolele de context sunt trimise la API-ul Anthropic pentru procesare. Conform politicii API (nu Claude.ai consumer), conversațiile nu sunt folosite pentru antrenament. Documentele indexate rămân local — doar extrasele relevante (sau documentele atașate explicit) sunt trimise ca context.',
  },
  {
    q: 'Câți utilizatori pot folosi aplicația?',
    a: 'Nelimitat în licența one-time, pentru aceeași instalare. Fiecare utilizator are propriul cont local cu permisiuni configurabile (avocat / asistent / custom). Pentru calculatoare multiple sau locații diferite, contactați-ne pentru licențe multi-seat.',
  },
  {
    q: 'Poate agentul să inventeze articole de lege?',
    a: 'Sistemul minimizează asta prin injecția automată a articolelor reale din corpus ca context verificat înainte de fiecare răspuns. Agenții sunt instruiți explicit să nu citeze articole care nu apar în contextul furnizat. Totuși, AI-ul nu este 100% predictibil — verificați mereu referințele importante pe legislatie.just.ro pentru versiunea în vigoare.',
  },
  {
    q: 'Funcționează pe macOS?',
    a: 'Da, există build pentru macOS (DMG, Apple Silicon + Intel). Testarea primară este pe Windows 10/11. Funcționalitatea este identică; doar locația bazei de date diferă (~/Library/Application Support/LexAI/).',
  },
  {
    q: 'Pot importa dosare existente?',
    a: 'În v1.0 nu există un importor automat pentru formate proprietare (Indaco, alte programe juridice). Puteți adăuga documentele în foldere supravegheate pentru indexare automată, apoi creați dosarele și legați documentele. Pentru migrări mari, contactați-ne — putem dezvolta un importor custom.',
  },
  {
    q: 'Cum șterg complet datele dacă renunț la aplicație?',
    a: 'Setări → Pericol → Șterge toate datele. Operația șterge baza de date SQLite, configurările, backup-urile (opțional), și revocă cheia API din keystore. Documentele indexate (referințe la fișiere) sunt eliminate, dar fișierele originale rămân unde au fost (aplicația nu le-a copiat niciodată).',
  },
];

const FAQItem = ({ item }) => {
  const [open, setOpen] = useStateH(false);
  return (
    <div className={`agent-doc ${open ? 'open' : ''}`} style={{ marginBottom: 6 }}>
      <button className="agent-doc-head" onClick={() => setOpen(!open)}>
        <div className="ad-meta">
          <div className="ad-name">{item.q}</div>
        </div>
        <div className="toggle"><HIcon name="plus" size={16} stroke={2} /></div>
      </button>
      <div className="agent-doc-body">
        <p style={{ marginTop: 16, marginBottom: 0, fontSize: 14 }}>{item.a}</p>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('faq-list-root')).render(
  <>{HELP_FAQ.map((it, i) => <FAQItem key={i} item={it} />)}</>
);

/* ============== Legi grid ============== */
const ALL_LEGI = [
  ['L. 287/2009', 'Cod Civil', '2.412'],
  ['L. 286/2009', 'Cod Penal', '446'],
  ['L. 134/2010', 'Cod Procedură Civilă', '1.116'],
  ['L. 135/2010', 'Cod Procedură Penală', '605'],
  ['L. 227/2015', 'Cod Fiscal', '498'],
  ['L. 207/2015', 'Cod Procedură Fiscală', '354'],
  ['OUG 57/2019', 'Cod Administrativ', '170'],
  ['L. 53/2003', 'Cod Muncii', '281'],
  ['L. 31/1990', 'Legea societăților', '296'],
  ['L. 85/2014', 'Procedura insolvenței', '348'],
  ['L. 554/2004', 'Contenciosul administrativ', '34'],
  ['L. 7/1996', 'Cadastru și publicitate', '70'],
  ['L. 272/2004', 'Protecția copilului', '147'],
  ['L. 217/2003', 'Violența domestică', '52'],
  ['L. 78/2000', 'Combaterea corupției', '32'],
  ['L. 656/2002', 'Combaterea spălării banilor', '28'],
  ['L. 98/2016', 'Achiziții publice clasice', '244'],
  ['L. 101/2016', 'Remedii achiziții publice', '67'],
  ['L. 241/2005', 'Combaterea evaziunii fiscale', '12'],
  ['L. 17/2014', 'Vânzarea terenurilor agricole', '21'],
  ['L. 196/2018', 'Asociații de proprietari', '108'],
  ['OG 13/2011', 'Dobânda legală', '14'],
  ['OG 21/1992', 'Protecția consumatorilor', '54'],
  ['OUG 80/2013', 'Taxe judiciare de timbru', '50'],
];

ReactDOM.createRoot(document.getElementById('legi-grid')).render(
  <>
    {ALL_LEGI.map(([num, title, arts]) => (
      <div key={num} className="code-row">
        <span className="code-num">{num}</span>
        <span className="code-title">{title} {arts && <span style={{ color: 'var(--text-dim)' }}>· {arts} art.</span>}</span>
      </div>
    ))}
  </>
);
