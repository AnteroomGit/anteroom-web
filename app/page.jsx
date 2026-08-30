'use client';

import { useState, useRef } from 'react';
import {
  Search,
  MapPin,
  ShieldCheck,
  Clock,
  Upload,
  FileText,
  X,
  Check,
} from 'lucide-react';
import Footer from './components/Footer';
import Header from './components/Header';
import { REASONS } from './constants';

/* ---------------------------------------------------------------
   Data
--------------------------------------------------------------- */
const TYPES = ['All', 'Liquidator', 'Small Business Restructuring Practitioner', 'Accountant', 'Lawyer'];

const NOTICE_OPTIONS = ['Director Penalty Notice', 'Garnishee notice', 'Statutory demand', 'Not sure'];

const PRACTITIONERS = [
  { id: 1, name: 'Marcus Reid', initials: 'MR', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Reid & Associates', suburb: 'Melbourne CBD', tags: ['Construction', 'SBR appointments'], next: 'Today', verified: true },
  { id: 2, name: 'Priya Nair', initials: 'PN', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Nair Advisory', suburb: 'Richmond', tags: ['Hospitality', 'Retail'], next: 'Tomorrow', verified: true },
  { id: 3, name: 'Daniel Osei', initials: 'DO', title: 'Small Business Restructuring Practitioner', type: 'Small Business Restructuring Practitioner', firm: 'Osei Restructuring', suburb: 'South Yarra', tags: ['SBR plans', 'ATO negotiation'], next: 'This week', verified: true },
  { id: 4, name: 'Claire Whitfield', initials: 'CW', title: 'Chartered Accountant, CA ANZ', type: 'Accountant', firm: 'Whitfield Partners', suburb: 'Fitzroy', tags: ['BAS review', 'Cash flow'], next: 'Today', verified: true },
  { id: 5, name: 'James Okafor', initials: 'JO', title: 'Principal Lawyer', type: 'Lawyer', firm: 'Okafor Legal', suburb: 'Collingwood', tags: ['Statutory demands', 'Director advice'], next: 'Tomorrow', verified: true },
  { id: 6, name: 'Sophie Tran', initials: 'ST', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Tran Insolvency', suburb: 'Brunswick', tags: ['Hospitality', 'SBR appointments'], next: 'This week', verified: true },
];

const QUICK_LINKS = ['Director Penalty Notice', 'Statutory demand', "Can't pay super", 'Garnishee notice', 'Voluntary deregistration', 'Small Business Restructuring'];

/* ---------------------------------------------------------------
   Triage question flow — short, sharp, one tap each.
   Structure: trigger identification -> (for real distress signals)
   a shared pathway-eligibility check -> a specific outcome that
   names urgency AND which formal mechanism likely fits.
--------------------------------------------------------------- */
const TRIAGE = {
  'notice-type': {
    question: 'What did you receive?',
    options: [
      { label: 'Director Penalty Notice', value: 'dpn', next: 'dpn-check' },
      { label: 'Garnishee notice', value: 'garnishee', next: 'scale-check' },
      { label: 'Statutory demand', value: 'statutory', next: 'scale-check' },
      { label: 'Not sure', value: 'unsure', next: 'scale-check' },
    ],
  },
  'dpn-check': {
    question: 'Were your BAS and super lodgements submitted on time?',
    subtext: 'Even if they weren’t paid.',
    options: [
      { label: 'Yes, on time', value: 'onTime', next: 'scale-check' },
      { label: 'No, they were late', value: 'late', next: 'scale-check' },
      { label: 'Not sure', value: 'unsure', next: 'scale-check' },
    ],
  },
  'worried-1': {
    question: 'Are wages and super up to date?',
    options: [
      { label: 'Yes', value: 'current', next: 'worried-2' },
      { label: 'No', value: 'behind', next: 'worried-1b' },
    ],
  },
  'worried-1b': {
    question: 'How long has super been behind?',
    options: [
      { label: 'Under 2 weeks', value: 'short', next: 'worried-2' },
      { label: '2\u20136 weeks', value: 'medium', next: 'scale-check' },
      { label: 'More than 6 weeks', value: 'long', next: 'scale-check' },
    ],
  },
  'worried-2': {
    question: 'Paying suppliers on normal terms?',
    options: [
      { label: 'Yes, normal terms', value: 'normal', next: 'done' },
      { label: 'Stretching it out', value: 'stretched', next: 'done' },
    ],
  },
  'close-solvency': {
    question: 'Can the business pay everything it owes, in full?',
    subtext: 'Even if you stopped trading today.',
    options: [
      { label: 'Yes, in full', value: 'yes', next: 'close-1' },
      { label: 'No', value: 'no', next: 'scale-check' },
      { label: 'Not sure', value: 'notsure', next: 'scale-check' },
    ],
  },
  'close-1': {
    question: 'Has the company stopped trading?',
    options: [
      { label: 'Yes', value: 'yes', next: 'close-2' },
      { label: 'No, still trading', value: 'no', next: 'done' },
    ],
  },
  'close-2': {
    question: 'Any debts at all right now?',
    options: [
      { label: 'No debts', value: 'no', next: 'close-3' },
      { label: 'Some, but fully payable', value: 'yes', next: 'close-mvl' },
    ],
  },
  'close-3': {
    question: 'Assets worth more than $1,000?',
    options: [
      { label: 'No', value: 'no', next: 'close-4' },
      { label: 'Yes', value: 'yes', next: 'close-mvl' },
    ],
  },
  'close-4': {
    question: 'All tax returns and BAS lodgements up to date?',
    options: [
      { label: 'Yes', value: 'yes', next: 'done' },
      { label: 'No', value: 'no', next: 'close-mvl' },
    ],
  },
  'close-mvl': {
    question: 'Just to confirm — solvent, but more to sort out than a simple close?',
    options: [
      { label: 'Yes, that’s right', value: 'yes', next: 'done' },
    ],
  },
  'scale-check': {
    question: 'Roughly, what would you estimate total business debts to be?',
    options: [
      { label: 'Under $1 million', value: 'under', next: 'entitlements-check' },
      { label: '$1 million or more', value: 'over', next: 'entitlements-check' },
      { label: 'Not sure', value: 'unsure', next: 'entitlements-check' },
    ],
  },
  'entitlements-check': {
    question: 'Are all wages and super currently due actually paid?',
    options: [
      { label: 'Yes', value: 'yes', next: 'lodgements-check' },
      { label: 'No', value: 'no', next: 'lodgements-check' },
    ],
  },
  'lodgements-check': {
    question: 'Are tax lodgements (BAS, tax returns) up to date?',
    options: [
      { label: 'Yes', value: 'yes', next: 'route-after-lodgements' },
      { label: 'No', value: 'no', next: 'route-after-lodgements' },
    ],
  },
  'viability-check': {
    question: 'Do you think the business is still viable, or is it time to close it?',
    options: [
      { label: 'Still viable, worth exploring', value: 'viable', next: 'done' },
      { label: 'Time to close it down', value: 'close', next: 'done' },
      { label: 'Not sure', value: 'notsure', next: 'done' },
    ],
  },
};

// Not every screen has a fixed "next" — lodgements-check branches on
// whether the answers so far already qualify for SBR.
function resolveAfterLodgements(a) {
  const sbrEligible = a.debtScale === 'under' && a.entitlementsOk === 'yes' && a.lodgementsOk === 'yes';
  return sbrEligible ? 'done' : 'viability-check';
}

const REASON_START = { ato: 'notice-type', money: 'worried-1', debts: 'worried-1', close: 'close-solvency' };

/* ---------------------------------------------------------------
   Outcome copy — urgency (the specific notice) and pathway
   (the formal mechanism, if any) are shown as two separate,
   honest pieces rather than one blended verdict.
--------------------------------------------------------------- */
const NOTICE_INFO = {
  dpnNonLockdown: { urgent: true, title: 'Non-lockdown Director Penalty Notice', text: 'You have 21 days from the date on the notice to pay in full or appoint a practitioner — either stops personal liability attaching.', deadlineDays: 21 },
  dpnLockdown: { urgent: true, title: 'Lockdown Director Penalty Notice', text: 'Because lodgements were late, personal liability has already attached. This is about your options from here, not preventing it.' },
  dpnUnsure: { urgent: true, title: 'Director Penalty Notice, type unclear', text: 'Whether you have 21 days or none depends on one fact you don’t currently know — worth getting the actual notice checked quickly.' },
  garnishee: { urgent: true, title: 'Garnishee notice', text: 'This is already redirecting your cash, not a future risk.' },
  statutory: { urgent: true, title: 'Statutory demand', text: 'You have 21 days to pay or apply to set it aside. No action means the company can be presumed insolvent.', deadlineDays: 21 },
  noticeUnsure: { urgent: true, title: 'Notice received, type unclear', text: 'Different notices carry very different deadlines — worth confirming which one this is quickly.' },
};

const PATHWAY_INFO = {
  sbr: {
    label: 'Likely eligible',
    title: 'Small Business Restructuring may be a strong option',
    text: 'You keep running the business day to day while a registered practitioner helps put together a formal plan for what’s owed. Creditors vote on it — if approved, you keep trading under it. A practitioner will confirm the finer eligibility details, including whether SBR has been used in the last 7 years.',
  },
  va: {
    label: 'Worth exploring',
    title: 'Voluntary Administration is likely worth exploring',
    text: 'Small Business Restructuring probably isn’t available here, but that doesn’t mean the business is finished. An administrator pauses creditor action while properly assessing options — it can still lead to a plan that keeps the business going, not just a wind-up.',
  },
  cvl: {
    label: 'An orderly path',
    title: 'Creditors Voluntary Liquidation may be the right path',
    text: 'If the business genuinely isn’t viable to continue, a director-led, orderly wind-up is often the most responsible next step — not a failure, a properly managed close.',
  },
};

const CLOSE_INFO = {
  simple: { title: 'Voluntary deregistration looks like a fit', text: 'Stopped trading, no debts, minimal assets, lodgements current — that matches ASIC’s criteria for a simple, self-serve close via Form 6010.' },
  mvl: { title: 'Members Voluntary Liquidation looks like the right fit', text: 'Because the business is solvent, this isn’t really an insolvency situation — an MVL is the formal, orderly way to close a solvent company and distribute what’s left to shareholders.' },
  stillTrading: { title: 'One step before this applies', text: 'Closing down only applies once trading has genuinely stopped — come back through once that’s the case.' },
};

const CALM_INFO = {
  low: { title: 'No red flags right now', text: 'Notice, super, and supplier terms are all clear. Worth revisiting if anything changes.' },
  mild: { title: 'Worth a proactive look, not urgent', text: 'A short delay here and there is common and rarely a crisis on its own — worth a light check-in, nothing more urgent than that.' },
};

function getResult(a) {
  // Notice branch
  if (a.noticeType) {
    let noticeKey = null;
    if (a.noticeType === 'dpn') {
      noticeKey = a.dpnLodged === 'onTime' ? 'dpnNonLockdown' : a.dpnLodged === 'late' ? 'dpnLockdown' : 'dpnUnsure';
    } else if (a.noticeType === 'garnishee') noticeKey = 'garnishee';
    else if (a.noticeType === 'statutory') noticeKey = 'statutory';
    else noticeKey = 'noticeUnsure';

    const pathwayKey = getPathwayKey(a);
    return { notice: NOTICE_INFO[noticeKey], pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null };
  }

  // Close branch
  if (a.closeSolvency !== undefined) {
    if (a.closeSolvency === 'yes') {
      if (a.closeStoppedTrading === 'no') return { close: CLOSE_INFO.stillTrading };
      if (a.closeDebts === 'no' && a.closeAssets === 'no' && a.closeLodgements === 'yes') return { close: CLOSE_INFO.simple };
      return { close: CLOSE_INFO.mvl };
    }
    const pathwayKey = getPathwayKey(a);
    return { pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null };
  }

  // Worried/debts branch
  if (a.worriedSuper) {
    if (a.worriedSuper === 'current' && a.worriedSuppliers === 'normal') return { calm: CALM_INFO.low };
    if (a.worriedSuper === 'current' && a.worriedSuppliers === 'stretched') return { calm: CALM_INFO.mild };
    if (a.worriedSuper === 'behind' && a.superBehindLength === 'short') return { calm: CALM_INFO.mild };
    const pathwayKey = getPathwayKey(a);
    return { pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null };
  }

  return null;
}

function getPathwayKey(a) {
  if (!a.debtScale) return null;
  const sbrEligible = a.debtScale === 'under' && a.entitlementsOk === 'yes' && a.lodgementsOk === 'yes';
  if (sbrEligible) return 'sbr';
  if (a.viability === 'close') return 'cvl';
  return 'va';
}

/* ---------------------------------------------------------------
   Small components
--------------------------------------------------------------- */
function PractitionerCard({ p, onBook }) {
  return (
    <div className="ar-card">
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div className="ar-avatar">{p.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontWeight: 300, fontSize: '0.98rem' }}>{p.name}</span>
            {p.verified && <ShieldCheck size={14} style={{ color: 'var(--sage)' }} />}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{p.title}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{p.firm}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
        <MapPin size={13} /> {p.suburb}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {p.tags.map((t) => <span key={t} className="ar-tag">{t}</span>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--teal)' }}>
        <Clock size={13} /> Next available: {p.next}
      </div>
      <button className="ar-btn-primary" onClick={() => onBook(p)}>Book consultation</button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Screens
--------------------------------------------------------------- */
function HomeScreen({ onPickReason, reason, setReason, location, setLocation }) {
  return (
    <>
      <div className="ar-hero">
        <h1>Find and book insolvency and restructuring professionals near you</h1>
        <div className="ar-searchbar">
          <div className="ar-search-field">
            <Search size={16} style={{ color: 'var(--ink-soft)' }} />
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">What&apos;s going on?</option>
              {REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="ar-search-divider" />
          <div className="ar-search-field">
            <MapPin size={16} style={{ color: 'var(--ink-soft)' }} />
            <input placeholder="Suburb or postcode" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <button className="ar-search-btn" onClick={() => onPickReason(reason)}>
            <Search size={15} /> Search
          </button>
        </div>
        <div className="ar-chip-row">
          {REASONS.map((r) => (
            <button key={r.id} className={`ar-chip ${reason === r.id ? 'active' : ''}`} onClick={() => { setReason(r.id); onPickReason(r.id); }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ar-section">
        <h2>Common reasons people come here</h2>
        <div className="ar-quicklinks">
          {QUICK_LINKS.map((q) => <span key={q} className="ar-quicklink">{q}</span>)}
        </div>
      </div>

      <div className="ar-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div>
          <ShieldCheck size={22} style={{ color: 'var(--teal)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Every practitioner is registered and verified</p>
        </div>
        <div>
          <Clock size={22} style={{ color: 'var(--teal)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Book a consultation online, no phone call needed</p>
        </div>
        <div>
          <FileText size={22} style={{ color: 'var(--teal)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Share your documents ahead, so your first meeting isn&apos;t a cold start</p>
        </div>
      </div>
    </>
  );
}

function TriageScreen({ step, onAnswer, onBack }) {
  const q = TRIAGE[step];
  return (
    <div className="ar-section" style={{ maxWidth: 480 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1.25rem' }} onClick={onBack}>&larr; Back</button>
      <h2 style={{ marginBottom: '0.3rem' }}>{q.question}</h2>
      {q.subtext && <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1.1rem' }}>{q.subtext}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: q.subtext ? 0 : '1.1rem' }}>
        {q.options.map((opt) => (
          <button key={opt.value} className="ar-chip" style={{ textAlign: 'left', borderRadius: 10 }} onClick={() => onAnswer(step, opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DeadlineCalculator({ days }) {
  const [dateStr, setDateStr] = useState('');
  let remaining = null;
  if (dateStr) {
    const noticeDate = new Date(dateStr);
    const today = new Date();
    remaining = days - Math.floor((today - noticeDate) / (1000 * 60 * 60 * 24));
  }
  return (
    <div className="ar-card" style={{ marginTop: '0.9rem' }}>
      <p style={{ fontWeight: 300, fontSize: '0.88rem', margin: '0 0 0.5rem' }}>See exactly how many days you have left</p>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" className="ar-input" style={{ maxWidth: 180 }} value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        {remaining !== null && (
          <span style={{ fontWeight: 300, color: remaining <= 5 ? 'var(--clay)' : 'var(--teal)' }}>
            {remaining > 0 ? `${remaining} days left` : 'Window may have passed — get advice today'}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ type, setType, onBook, result }) {
  const filtered = type === 'All' ? PRACTITIONERS : PRACTITIONERS.filter((p) => p.type === type);
  return (
    <div className="ar-section">
      {result?.notice && (
        <div className="ar-card" style={{ marginBottom: '0.9rem', borderLeft: '3px solid var(--clay)' }}>
          <p style={{ fontWeight: 300, margin: '0 0 0.3rem' }}>{result.notice.title}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: 0 }}>{result.notice.text}</p>
          {result.notice.deadlineDays && <DeadlineCalculator days={result.notice.deadlineDays} />}
        </div>
      )}
      {result?.pathway && (
        <div className="ar-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--teal)' }}>
          <span className="ar-tag" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{result.pathway.label}</span>
          <p style={{ fontWeight: 300, margin: '0 0 0.3rem' }}>{result.pathway.title}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: 0 }}>{result.pathway.text}</p>
        </div>
      )}
      {result?.close && (
        <div className="ar-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--sage)' }}>
          <p style={{ fontWeight: 300, margin: '0 0 0.3rem' }}>{result.close.title}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: 0 }}>{result.close.text}</p>
        </div>
      )}
      {result?.calm && (
        <div className="ar-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--sage)' }}>
          <p style={{ fontWeight: 300, margin: '0 0 0.3rem' }}>{result.calm.title}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: 0 }}>{result.calm.text}</p>
        </div>
      )}

      <div className="ar-type-row">
        {TYPES.map((t) => (
          <button key={t} className={`ar-type-chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>
      <div className="ar-grid">
        {filtered.map((p) => <PractitionerCard key={p.id} p={p} onBook={onBook} />)}
      </div>
    </div>
  );
}

function BookingScreen({ practitioner, onConfirm, onBack }) {
  const [slot, setSlot] = useState(null);
  const slots = ['9:00 AM', '11:30 AM', '2:00 PM', '4:15 PM'];
  return (
    <div className="ar-section" style={{ maxWidth: 520 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back to results</button>
      <div className="ar-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="ar-avatar">{practitioner.initials}</div>
          <div>
            <div style={{ fontWeight: 300 }}>{practitioner.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{practitioner.title} — {practitioner.firm}</div>
          </div>
        </div>
      </div>
      <p className="ar-label">Choose a time</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {slots.map((s) => (
          <div key={s} className={`ar-slot ${slot === s ? 'active' : ''}`} onClick={() => setSlot(s)}>{s}</div>
        ))}
      </div>
      <button className="ar-btn-primary" disabled={!slot} style={{ opacity: slot ? 1 : 0.5 }} onClick={() => onConfirm(slot)}>
        Continue
      </button>
    </div>
  );
}

function PortalScreen({ practitioner, onDone, onBack }) {
  const [noticeType, setNoticeType] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [consent, setConsent] = useState(false);
  const fileInput = useRef(null);

  function handleFiles(e) {
    const chosen = Array.from(e.target.files || []);
    setFiles((f) => [...f, ...chosen.map((c) => c.name)]);
  }

  return (
    <div className="ar-section" style={{ maxWidth: 560 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back</button>
      <h2>Before your consultation</h2>
      <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.6rem', marginBottom: '1.25rem' }}>
        Adding this now means {practitioner.name.split(' ')[0]} can review your situation before you meet, rather than starting cold.
      </p>

      <label className="ar-label">Have you received a notice?</label>
      <select className="ar-select" value={noticeType} onChange={(e) => setNoticeType(e.target.value)} style={{ marginBottom: '1rem' }}>
        <option value="">Select one</option>
        {NOTICE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        <option value="None">None received</option>
      </select>

      {noticeType && noticeType !== 'None' && (
        <>
          <label className="ar-label">Date on the notice</label>
          <input type="date" className="ar-input" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} style={{ marginBottom: '1rem' }} />
        </>
      )}

      <label className="ar-label">Financial statements or ATO documents</label>
      <div className="ar-dropzone" onClick={() => fileInput.current.click()}>
        <Upload size={20} style={{ color: 'var(--ink-soft)' }} />
        <p style={{ fontSize: '0.86rem', margin: '0.5rem 0 0' }}>Click to add files (PDF, JPG, PNG)</p>
        <input ref={fileInput} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFiles} />
      </div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
              <FileText size={14} style={{ color: 'var(--ink-soft)' }} />
              {f}
              <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto', color: 'var(--ink-soft)' }} onClick={() => setFiles(files.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </div>
      )}

      <label className="ar-label" style={{ marginTop: '1rem' }}>Anything else worth mentioning?</label>
      <textarea className="ar-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginBottom: '1.1rem' }} />

      <label className="ar-checkbox-row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '0.15rem' }} />
        I consent to this information being shared with {practitioner.name} ahead of our consultation.
      </label>

      <button className="ar-btn-primary" disabled={!consent} style={{ opacity: consent ? 1 : 0.5 }} onClick={onDone}>
        Confirm booking
      </button>
    </div>
  );
}

function ConfirmedScreen({ practitioner, slot, onHome }) {
  return (
    <div className="ar-section" style={{ maxWidth: 480, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--sage-tint)', color: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
        <Check size={24} />
      </div>
      <h2>You&apos;re booked</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
        {slot} with {practitioner.name}, {practitioner.firm}. They&apos;ll have your details ahead of time.
      </p>
      <button className="ar-btn-ghost" onClick={onHome}>Back to search</button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Page
--------------------------------------------------------------- */
export default function Page() {
  const [screen, setScreen] = useState('home');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('All');
  const [practitioner, setPractitioner] = useState(null);
  const [slot, setSlot] = useState(null);
  const [answers, setAnswers] = useState({});
  const [triageStep, setTriageStep] = useState(null);

  function pickReason(r) {
    const start = REASON_START[r];
    if (start) {
      setTriageStep(start);
      setScreen('triage');
    } else {
      setScreen('results');
    }
  }

  const KEY_MAP = {
    'notice-type': 'noticeType',
    'dpn-check': 'dpnLodged',
    'worried-1': 'worriedSuper',
    'worried-1b': 'superBehindLength',
    'worried-2': 'worriedSuppliers',
    'close-solvency': 'closeSolvency',
    'close-1': 'closeStoppedTrading',
    'close-2': 'closeDebts',
    'close-3': 'closeAssets',
    'close-4': 'closeLodgements',
    'close-mvl': 'closeMvlConfirm',
    'scale-check': 'debtScale',
    'entitlements-check': 'entitlementsOk',
    'lodgements-check': 'lodgementsOk',
    'viability-check': 'viability',
  };

  function answerTriage(step, opt) {
    const key = KEY_MAP[step];
    const updated = { ...answers, [key]: opt.value };
    setAnswers(updated);

    let next = opt.next;
    if (next === 'route-after-lodgements') next = resolveAfterLodgements(updated);

    if (next === 'done') {
      setScreen('results');
    } else {
      setTriageStep(next);
    }
  }

  const result = getResult(answers);

  function goHome() {
    setScreen('home');
    setAnswers({});
    setTriageStep(null);
  }

  return (
    <div className="ar-root">
      <Header />

      {screen === 'home' && (
        <HomeScreen
          onPickReason={pickReason}
          reason={reason} setReason={setReason}
          location={location} setLocation={setLocation}
        />
      )}
      {screen === 'triage' && (
        <TriageScreen step={triageStep} onAnswer={answerTriage} onBack={goHome} />
      )}
      {screen === 'results' && (
        <ResultsScreen type={type} setType={setType} result={result} onBook={(p) => { setPractitioner(p); setScreen('booking'); }} />
      )}
      {screen === 'booking' && (
        <BookingScreen practitioner={practitioner} onBack={() => setScreen('results')} onConfirm={(s) => { setSlot(s); setScreen('portal'); }} />
      )}
      {screen === 'portal' && (
        <PortalScreen practitioner={practitioner} onBack={() => setScreen('booking')} onDone={() => setScreen('confirmed')} />
      )}
      {screen === 'confirmed' && (
        <ConfirmedScreen practitioner={practitioner} slot={slot} onHome={goHome} />
      )}

      <Footer />
    </div>
  );
}
