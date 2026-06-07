/* LEX AI marketing — interactive demos + feature mockup UIs
   Depends on: shared.jsx (MIcon, Logo, etc.) */

const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;
const Icon = window.MIcon;

/* =====================================================================
   AGENT SELECTOR DEMO
   ===================================================================== */
const AGENTS_FULL = [
  {
    id: 'penal', name: 'Avocat Penal', initial: 'P',
    domain: 'Cod Penal · CPP · L. 78/2000',
    desc: 'Drept penal substanțial și procedural',
    q: 'Care e termenul de prescripție pentru înșelăciune calificată (art. 244 alin. 2 CP) și de când curge?',
    a: [
      { text: 'Pentru înșelăciune în formă calificată, pedeapsa prevăzută este închisoarea de la 1 la 5 ani.' },
      { text: 'Conform ', cite: 'art. 154 alin. (1) lit. d) CP', textAfter: ', termenul de prescripție a răspunderii penale este de ', emp: '5 ani', textEnd: ' — încadrarea fiind în categoria infracțiunilor sancționate cu închisoare mai mică de 5 ani.' },
      { text: 'Termenul curge, conform ', cite: 'art. 154 alin. (2) CP', textAfter: ', de la data săvârșirii infracțiunii. Pentru infracțiuni de durată sau succesive, de la data ultimului act material.' },
      { text: 'Atenție: ', emp: 'cursul prescripției se întrerupe', textEnd: ' la fiecare act de procedură comunicat suspectului — art. 155 alin. (1) CP. Termen efectiv maxim: 10 ani (dublul) prin întrerupere repetată.' },
    ],
  },
  {
    id: 'civil', name: 'Avocat Civil', initial: 'C',
    domain: 'Cod Civil · CPC · L. consumator',
    desc: 'Contracte, răspundere, succesiuni',
    q: 'Care este termenul de prescripție pentru o acțiune în răspundere civilă delictuală pentru un prejudiciu produs în 2023?',
    a: [
      { text: 'Termenul general de prescripție pentru acțiunile în răspundere civilă delictuală este de ', emp: '3 ani', textEnd: ' — conform ', cite: 'art. 2.517 Cod Civil', textAfter: '.' },
      { text: 'Conform ', cite: 'art. 2.528 alin. (1) Cod Civil', textAfter: ', termenul începe să curgă de la data la care păgubitul a cunoscut sau trebuia să cunoască: (a) paguba, și (b) pe cel răspunzător.' },
      { text: 'Pentru un fapt din 2023, dacă păgubitul a cunoscut prejudiciul la momentul producerii, acțiunea se prescrie în 2026. Recomand verificarea momentului exact al cunoașterii — poate fi diferit de data faptei (ex. fraude descoperite ulterior).' },
    ],
  },
  {
    id: 'imobil', name: 'Drept Imobiliar', initial: 'I',
    domain: 'L. 7/1996 · cadastru · CF',
    desc: 'Carte funciară, tranzacții, urbanism',
    q: 'Ce verific într-un extras CF înainte de antecontract? Cumpărătorul achită un avans de 50.000 EUR.',
    a: [
      { text: 'Verificare obligatorie în ', emp: 'extras CF de informare (B + C + D)', textEnd: ', emis cu cel mult 30 de zile înainte:' },
      { text: '1. ', cite: 'Partea B', textAfter: ' — proprietar(i) și actul de dobândire. Confruntă cu CI-ul vânzătorului. Verifică dacă există coproprietari care nu apar pe antecontract.' },
      { text: '2. ', cite: 'Partea C', textAfter: ' — sarcini: ipoteci, interdicții de înstrăinare, sechestre, dezmembrăminte (uzufruct, abitație), procese-verbale ANAF, drepturi de creanță înscrise.' },
      { text: '3. ', cite: 'Partea D', textAfter: ' — observații, mențiuni juridice. Atenție la mențiuni privind proceduri de partaj sau revendicare pendinte.' },
      { text: 'Pentru un avans de 50.000 EUR recomand ', emp: 'extras CF actualizat la data antecontractului', textEnd: ' + clauză suspensivă: rezoluțiune cu restituire dublată a avansului dacă apar sarcini necomunicate (art. 2 din L. 7/1996 + art. 1.670 Cod Civil).' },
    ],
  },
  {
    id: 'comercial', name: 'Drept Comercial', initial: 'M',
    domain: 'L. 31/1990 · L. 85/2014 · M&A',
    desc: 'Societăți, insolvență, contracte B2B',
    q: 'Clientul vrea să cesioneze 60% din părțile sale dintr-un SRL. Ce pași și ce acte sunt necesare?',
    a: [
      { text: 'Operațiunea presupune două componente: ', emp: 'cesiune de părți sociale + modificare act constitutiv', textEnd: '.' },
      { text: 'Conform ', cite: 'art. 202 L. 31/1990', textAfter: ', cesiunea către un terț e posibilă doar cu aprobarea AGA cu o majoritate de 3/4 din capital, ', emp: 'dacă actul constitutiv nu prevede altfel', textEnd: '. Verifică prima dată actul constitutiv pentru clauze de preempțiune între asociați.' },
      { text: 'Pași procedurali:' },
      { text: '• Convocator AGA + hotărâre AGA aprobare cesiune' },
      { text: '• Contract de cesiune părți sociale (în formă autentică recomandat dacă vânzătorul nu e prezent)' },
      { text: '• Act constitutiv actualizat' },
      { text: '• Depunere ONRC (cerere + dosar M-04) — termen de înregistrare 3 zile lucrătoare' },
      { text: 'Atenție la implicații fiscale: cesiunea > prag = obligație declarare la ANAF, impozit pe câștig.' },
    ],
  },
  {
    id: 'familie', name: 'Drept Familie', initial: 'F',
    domain: 'CC II · L. 272/2004 · L. 217/2003',
    desc: 'Divorț, custodie, alimony',
    q: 'Cum calculez pensia de întreținere pentru 2 copii minori, tatăl având venit net 6500 lei/lună?',
    a: [
      { text: 'Conform ', cite: 'art. 529 alin. (2) Cod Civil', textAfter: ', cota pentru întreținerea copiilor este:' },
      { text: '• Un singur copil: ', emp: 'până la 1/4', textEnd: ' din venitul net' },
      { text: '• Doi copii: ', emp: 'până la 1/3', textEnd: ' din venitul net' },
      { text: '• Trei sau mai mulți: ', emp: 'până la 1/2', textEnd: ' din venitul net' },
      { text: 'Calculul pentru cazul tău: 6.500 lei × 1/3 = ', emp: '2.166 lei/lună', textEnd: ' (cota maximă). Suma se împarte între cei doi copii — 1.083 lei/copil.' },
      { text: 'Conform ', cite: 'art. 529 alin. (3)', textAfter: ', limita se aplică doar dacă cuantumul nu depășește necesarul real al copiilor. Instanța poate stabili sub plafon dacă tatăl dovedește că nu are capacitate.' },
      { text: 'Recomand cerere de stabilire cu actualizare anuală automată conform indicelui de inflație (art. 533 Cod Civil).' },
    ],
  },
  {
    id: 'fiscal', name: 'Drept Fiscal', initial: '€',
    domain: 'L. 227/2015 · L. 207/2015 · ANAF',
    desc: 'TVA, contestații, contencios fiscal',
    q: 'Decizie de impunere de la ANAF cu 142.000 lei TVA suplimentar. Ce pași și care sunt termenele?',
    a: [
      { text: 'Procedura administrativ-fiscală obligatorie înainte de instanță, conform ', cite: 'art. 268-281 Cod Procedură Fiscală (L. 207/2015)', textAfter: '.' },
      { text: 'Pasul 1: ', emp: 'Contestație administrativă', textEnd: ' la organul fiscal emitent. Termen: ', emp: '45 de zile', textEnd: ' de la comunicare (art. 270). Suspendă executarea ', emp: 'numai dacă', textEnd: ' depui și cerere de suspendare cu garanție.' },
      { text: 'Pasul 2: După respingere (sau tăcere 6 luni), ', emp: 'acțiune în contencios fiscal', textEnd: ' la Tribunalul/Curtea de Apel competentă. Termen: ', cite: '6 luni de la comunicare răspuns / 1 an de la depunere contestație', textAfter: '.' },
      { text: 'Pentru sumă peste 1 milion lei → competență Curtea de Apel în primă instanță. Pentru 142.000 lei → Tribunalul.' },
      { text: 'Atenție: ', emp: 'plata sumei nu este obligatorie', textEnd: ' pentru a contesta, dar fără suspendare poți primi executare silită în paralel.' },
    ],
  },
  {
    id: 'admin', name: 'Drept Administrativ', initial: 'A',
    domain: 'L. 554/2004 · L. 98/2016 · CNSC',
    desc: 'Contencios, achiziții publice, CNSC',
    q: 'Primăria refuză autorizația de construire fără motivare. Plângere prealabilă sau direct instanța?',
    a: [
      { text: 'Conform ', cite: 'art. 7 L. 554/2004 a contenciosului administrativ', textAfter: ', ', emp: 'plângerea prealabilă este obligatorie', textEnd: ' înainte de instanță, în 30 de zile de la comunicarea actului.' },
      { text: 'Excepție unde se sare peste plângere: actele care, prin natura lor, nu pot face obiectul revocării (rare; nu e cazul aici).' },
      { text: 'Pași concreți:' },
      { text: '1. ', emp: 'Plângere prealabilă', textEnd: ' la primar/CL — termen 30 zile, răspuns 30 zile' },
      { text: '2. La respingere sau tăcere → ', emp: 'acțiune contencios administrativ', textEnd: ' la Tribunal, secția contencios, în 6 luni de la răspuns / 1 an de la actul atacat' },
      { text: '3. Cere instanței anularea + obligarea emiterii autorizației + daune (art. 18-19 L. 554/2004)' },
      { text: 'Lipsa motivării e motiv autonom de nulitate — art. 1 alin. (2) lit. e) și jurisprudența ICCJ (Dec. 12/2018 RIL).' },
    ],
  },
  {
    id: 'redactor', name: 'Redactor Documente', initial: 'R',
    domain: 'Documente juridice românești',
    desc: 'Drafting court-ready',
    q: 'Redactează o notificare de punere în întârziere pentru recuperare creanță 47.500 lei (factură neachitată).',
    a: [
      { text: 'Generat. Document salvat ca ', cite: 'notificare-punere-in-intarziere-v1.docx', textAfter: '. Structură:' },
      { text: '• Antet expeditor (cabinet + reprezentat)' },
      { text: '• Destinatar: [DENUMIRE DEBITOR], [CUI], [SEDIU]' },
      { text: '• Obiect: punere în întârziere conform ', cite: 'art. 1.522 Cod Civil' },
      { text: '• Stare de fapt: factura nr. [NR FACTURĂ] din [DATA], scadentă [DATA SCADENȚEI], sumă 47.500 lei' },
      { text: '• Temei: ', cite: 'art. 1.522, 1.523 Cod Civil', textAfter: ' + clauze contractuale [DACĂ EXISTĂ]' },
      { text: '• Solicitare: plata sumei + dobânzi legale (', cite: 'art. 1.535 + OG 13/2011', textAfter: ') în ', emp: '15 zile calendaristice', textEnd: ' de la primire' },
      { text: '• Avertizare: depășirea termenului → acțiune în instanță + executare silită + cheltuieli de judecată' },
      { text: 'Câmpuri marcate cu ', emp: '[PARANTEZE DREPTE]', textEnd: ' pentru completare manuală. Diacritice verificate.' },
    ],
  },
  {
    id: 'cercetare', name: 'Cercetare Juridică', initial: '⊕', opus: true,
    domain: 'Opus 4.8 · analize aprofundate',
    desc: 'Memo-uri structurate, jurisprudență',
    q: 'Există jurisprudență ICCJ recentă privind admisibilitatea probelor obținute prin interceptare în lipsa autorizării judecătorului?',
    a: [
      { text: 'Memo · Jurisprudență ICCJ — interceptări fără autorizare' },
      { text: '', divider: true },
      { text: 'Norme aplicabile: ', cite: 'art. 138-140 CPP', textAfter: ' (mandat de supraveghere tehnică, emitere doar de judecător de drepturi și libertăți).' },
      { text: 'Doctrina constituțională:' },
      { text: '• ', cite: 'CCR Dec. 51/2016', textAfter: ' — a declarat neconstituțională sintagma "ori de alte organe specializate ale statului" din art. 142 alin. (1) CPP. Doar organele judiciare pot pune în executare mandatele.' },
      { text: '• ', cite: 'CCR Dec. 22/2018', textAfter: ' — extindere efecte: probele obținute cu participarea SRI sunt afectate de viciul constituțional.' },
      { text: 'Jurisprudență ICCJ:' },
      { text: '• ', cite: 'ICCJ s.p. dec. nr. 87/A/2022', textAfter: ' — excluderea probelor obținute fără mandat valid emis de judecător (sancțiune: nulitate absolută).' },
      { text: '• ', cite: 'ICCJ HP nr. 47/2023', textAfter: ' — clarificare: nulitatea operează ', emp: 'erga omnes', textEnd: ' pentru toate probele derivate (teoria fructelor pomului otrăvit, art. 102 CPP).' },
      { text: 'Concluzie: probele sunt ', emp: 'inadmisibile', textEnd: '. Recomand cerere de excludere în baza ', cite: 'art. 102 alin. (2) CPP', textAfter: ', invocată la primul termen, sub sancțiunea decăderii.' },
    ],
  },
];

const renderTextPart = (p, i) => {
  const parts = [];
  if (p.divider) return <hr key={i} style={{ border: 0, borderTop: '1px solid var(--border)', margin: '6px 0' }} />;
  if (p.text) parts.push(<span key="t">{p.text}</span>);
  if (p.cite) parts.push(<span key="c" className="cite-ref">{p.cite}</span>);
  if (p.textAfter) parts.push(<span key="ta">{p.textAfter}</span>);
  if (p.emp) parts.push(<em key="e">{p.emp}</em>);
  if (p.textEnd) parts.push(<span key="te">{p.textEnd}</span>);
  return <p key={i}>{parts}</p>;
};

const AgentDemo = () => {
  const [activeId, setActiveId] = useStateD('penal');
  const active = AGENTS_FULL.find(a => a.id === activeId);

  return (
    <div className="agent-demo">
      <div className="agent-demo-grid">
        <div className="agent-card agent-card-add" aria-hidden="true">
          <div className="agent-card-head">
            <div className="agent-ring agent-ring-add">+</div>
            <div className="agent-card-meta">
              <div className="agent-card-name">Creează agent</div>
              <div className="agent-card-domain">Agent personalizat · până la 15</div>
            </div>
          </div>
          <div className="agent-card-desc">Definește propriul prompt și ramura de drept.</div>
        </div>
        {AGENTS_FULL.map(a => (
          <button
            key={a.id}
            className={`agent-card ${activeId === a.id ? 'active' : ''}`}
            onClick={() => setActiveId(a.id)}>
            <div className="agent-card-head">
              <div className={`agent-ring ${a.opus ? 'opus' : ''}`}>{a.initial}</div>
              <div className="agent-card-meta">
                <div className="agent-card-name">
                  {a.name}
                  {a.opus && <span className="opus-pill">OPUS</span>}
                </div>
                <div className="agent-card-domain">{a.domain}</div>
              </div>
            </div>
            <div className="agent-card-desc">{a.desc}</div>
          </button>
        ))}
      </div>

      <div className="agent-chat">
        <div className="agent-chat-head">
          <div className="agent-tag-mini">
            <div className={`agent-ring ${active.opus ? 'opus' : ''}`}>{active.initial}</div>
            <div>
              <div className="agent-mini-name">{active.name}</div>
              <div className="agent-mini-model">
                <span className="status-dot"></span>
                {active.opus ? 'claude-opus-4-8' : 'claude-sonnet-4-6'} · context: 12 articole injectate
              </div>
            </div>
          </div>
          <div className="agent-chat-actions">
            <span className="chip">EXEMPLU SIMULAT</span>
          </div>
        </div>

        <div className="agent-chat-body" key={active.id}>
          <div className="bubble-user">
            <div className="b-meta">Av. Utilizator · acum 8s</div>
            <div className="b-content">{active.q}</div>
          </div>

          <div className="bubble-assistant">
            <div className="b-meta">
              <span className="b-who">{active.name}</span>
              <span>· răspuns cu corpus juridic intern</span>
            </div>
            <div className="b-content">
              {active.a.map((p, i) => renderTextPart(p, i))}
            </div>
            <div className="b-footer">
              <span className="cite-mini">⏱ 2.4s</span>
              <span className="cite-mini">↑ 1.2k input tokens · ↓ 487 output</span>
              <span className="cite-mini">📚 art. citate verificate în corpus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================================
   CORPUS SEARCH DEMO
   ===================================================================== */
const CORPUS_QUERIES = {
  'răspundere civilă': [
    { code: 'art. 1.349 Cod Civil', title: 'Răspunderea delictuală', text: 'Orice persoană are îndatorirea să respecte regulile de conduită pe care legea sau obiceiul locului le impune și să nu aducă atingere, prin acțiunile ori inacțiunile sale, drepturilor sau intereselor legitime ale altor persoane.', score: '12.84' },
    { code: 'art. 1.357 Cod Civil', title: 'Răspunderea pentru fapta proprie', text: 'Cel care cauzează altuia un prejudiciu printr-o faptă ilicită, săvârșită cu vinovăție, este obligat să îl repare. Autorul prejudiciului răspunde pentru cea mai ușoară culpă.', score: '11.92' },
    { code: 'art. 1.373 Cod Civil', title: 'Răspunderea comitenților', text: 'Comitentul este obligat să repare prejudiciul cauzat de prepușii săi ori de câte ori fapta săvârșită de aceștia are legătură cu atribuțiile sau cu scopul funcțiilor încredințate.', score: '10.21' },
    { code: 'art. 2.517 Cod Civil', title: 'Termenul general de prescripție', text: 'Termenul prescripției este de 3 ani, dacă legea nu prevede un alt termen.', score: '8.45' },
    { code: 'art. 1.385 Cod Civil', title: 'Întinderea reparației', text: 'Prejudiciul se repară integral, dacă prin lege nu se prevede altfel. Se datorează despăgubiri și pentru un prejudiciu viitor, dacă producerea lui este neîndoielnică.', score: '7.89' },
  ],
  'prescripție': [
    { code: 'art. 2.500 Cod Civil', title: 'Obiectul prescripției extinctive', text: 'Dreptul material la acțiune se stinge prin prescripție, dacă nu a fost exercitat în termenul stabilit de lege.', score: '14.21' },
    { code: 'art. 2.517 Cod Civil', title: 'Termenul general', text: 'Termenul prescripției este de 3 ani, dacă legea nu prevede un alt termen.', score: '13.04' },
    { code: 'art. 154 Cod Penal', title: 'Termenele prescripției răspunderii penale', text: 'Termenele de prescripție a răspunderii penale sunt: a) 15 ani, când legea prevede pentru infracțiunea săvârșită pedeapsa detențiunii pe viață sau a închisorii mai mare de 20 de ani...', score: '12.87' },
    { code: 'art. 2.528 Cod Civil', title: 'Începutul cursului prescripției', text: 'Prescripția dreptului la acțiune în repararea unei pagube care a fost cauzată printr-o faptă ilicită începe să curgă de la data când păgubitul a cunoscut sau trebuia să cunoască atât paguba, cât și pe cel care răspunde de ea.', score: '11.45' },
    { code: 'art. 155 Cod Penal', title: 'Întreruperea cursului prescripției', text: 'Cursul termenului prescripției răspunderii penale se întrerupe prin îndeplinirea oricărui act de procedură în cauză.', score: '9.78' },
  ],
  'divorț': [
    { code: 'art. 373 Cod Civil', title: 'Motivele de divorț', text: 'Divorțul poate avea loc: a) prin acordul soților, la cererea ambilor soți; b) atunci când, din cauza unor motive temeinice, raporturile dintre soți sunt grav vătămate; c) la cererea unuia dintre soți, după o separare în fapt care a durat cel puțin 2 ani; d) la cererea aceluia dintre soți a cărui stare de sănătate face imposibilă continuarea căsătoriei.', score: '15.32' },
    { code: 'art. 375 Cod Civil', title: 'Divorțul prin acord la notar', text: 'Dacă soții sunt de acord cu divorțul și nu au copii minori, ofițerul de stare civilă sau notarul public de la locul căsătoriei sau al ultimei locuințe comune a soților poate constata desfacerea căsătoriei prin acordul soților.', score: '14.11' },
    { code: 'art. 396 Cod Civil', title: 'Exercitarea autorității părintești', text: 'Instanța, hotărând în privința exercitării autorității părintești, ține cont de înțelegerea părinților și de interesul superior al copilului.', score: '12.45' },
    { code: 'art. 402 Cod Civil', title: 'Stabilirea pensiei de întreținere', text: 'Instanța de tutelă, prin hotărârea de divorț, stabilește contribuția fiecărui părinte la cheltuielile de creștere, educare, învățătură și pregătire profesională a copiilor.', score: '11.02' },
    { code: 'art. 920 CPC', title: 'Cererea de divorț', text: 'Cererea de divorț va cuprinde, pe lângă cele prevăzute de lege pentru cererea de chemare în judecată, și numele copiilor minori născuți din căsătorie sau ai căror părinți le-au îngăduit această calitate.', score: '8.94' },
  ],
};

const CorpusDemo = () => {
  const [query, setQueryC] = useStateD('răspundere civilă');
  const [phase, setPhase] = useStateD('idle'); // idle | searching | done
  const [results, setResults] = useStateD(CORPUS_QUERIES['răspundere civilă']);

  const runQuery = (q) => {
    setQueryC(q);
    setPhase('searching');
    setResults([]);
    setTimeout(() => {
      setResults(CORPUS_QUERIES[q]);
      setPhase('done');
    }, 600);
  };

  return (
    <div className="corpus-demo">
      <div className="corpus-search-box">
        <Icon name="search" size={16} />
        <input
          value={query}
          onChange={(e) => setQueryC(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && CORPUS_QUERIES[query] && runQuery(query)}
          placeholder="ex. răspundere civilă, prescripție, divorț…"
        />
        <span className="corpus-meta">FTS5 · BM25 · 5.247 articole indexate</span>
      </div>

      <div className="corpus-chips">
        <span className="corpus-chip-label">Încearcă:</span>
        {Object.keys(CORPUS_QUERIES).map(k => (
          <button key={k}
            className={`corpus-chip ${query === k ? 'active' : ''}`}
            onClick={() => runQuery(k)}>
            {k}
          </button>
        ))}
      </div>

      <div className="corpus-results">
        <div className="corpus-results-head">
          <span>
            {phase === 'searching' ? 'Căutare în corpus…' : `Top ${results.length} articole pentru "${query}"`}
          </span>
          <span className="corpus-time">
            {phase === 'searching' ? <span className="spinner-tiny"></span> : '12ms'}
          </span>
        </div>

        {phase === 'searching' && (
          <div className="corpus-skeleton">
            {[1,2,3].map(i => <div key={i} className="skel-row"><div></div><div></div></div>)}
          </div>
        )}

        {phase !== 'searching' && results.map((r, i) => (
          <div key={r.code + i} className="corpus-result" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="cr-rank">{(i+1).toString().padStart(2, '0')}</div>
            <div className="cr-body">
              <div className="cr-head">
                <span className="cr-code">{r.code}</span>
                <span className="cr-title">— {r.title}</span>
                <span className="cr-score">BM25 {r.score}</span>
              </div>
              <div className="cr-text">{r.text}</div>
            </div>
          </div>
        ))}

        <div className="corpus-footer">
          <Icon name="sparkles" size={12} />
          Aceste {results.length} articole sunt injectate automat ca context verificat pentru fiecare întrebare relevantă.
        </div>
      </div>
    </div>
  );
};

window.AgentDemo = AgentDemo;
window.CorpusDemo = CorpusDemo;
