'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import Dropdown from './components/Dropdown';
import { REASONS } from './constants';
import { supabase } from '../lib/supabase';
import dynamic from 'next/dynamic';

// Leaflet touches window/document directly, so it can only run in the
// browser — dynamic import with ssr:false keeps it out of the server
// render entirely, avoiding a "window is not defined" build error.
const PractitionerMap = dynamic(() => import('./components/PractitionerMap'), { ssr: false });

/* ---------------------------------------------------------------
   Data
--------------------------------------------------------------- */
const TYPES = ['All', 'Liquidator', 'Small Business Restructuring Practitioner', 'Accountant', 'Lawyer'];

const NOTICE_OPTIONS = ['Director Penalty Notice', 'Garnishee notice', 'Statutory demand', 'Not sure'];

const PRACTITIONERS = [
  { id: 1, name: 'Marcus Reid', initials: 'MR', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Reid & Associates', suburb: 'Melbourne CBD', tags: ['Construction', 'SBR appointments'], next: 'Today', verified: true, lat: -37.8136, lng: 144.9631 },
  { id: 2, name: 'Priya Nair', initials: 'PN', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Nair Advisory', suburb: 'Richmond', tags: ['Hospitality', 'Retail'], next: 'Tomorrow', verified: true, lat: -37.8183, lng: 144.9946 },
  { id: 3, name: 'Daniel Osei', initials: 'DO', title: 'Small Business Restructuring Practitioner', type: 'Small Business Restructuring Practitioner', firm: 'Osei Restructuring', suburb: 'South Yarra', tags: ['SBR plans', 'ATO negotiation'], next: 'This week', verified: true, lat: -37.8385, lng: 144.9922 },
  { id: 4, name: 'Claire Whitfield', initials: 'CW', title: 'Chartered Accountant, CA ANZ', type: 'Accountant', firm: 'Whitfield Partners', suburb: 'Fitzroy', tags: ['BAS review', 'Cash flow'], next: 'Today', verified: true, lat: -37.7996, lng: 144.9784 },
  { id: 5, name: 'James Okafor', initials: 'JO', title: 'Principal Lawyer', type: 'Lawyer', firm: 'Okafor Legal', suburb: 'Collingwood', tags: ['Statutory demands', 'Director advice'], next: 'Tomorrow', verified: true, lat: -37.8025, lng: 144.9880 },
  { id: 6, name: 'Sophie Tran', initials: 'ST', title: 'Registered Liquidator', type: 'Liquidator', firm: 'Tran Insolvency', suburb: 'Brunswick', tags: ['Hospitality', 'SBR appointments'], next: 'This week', verified: true, lat: -37.7663, lng: 144.9614 },
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
      { label: 'No debts', value: 'no', next: 'assets-check' },
      { label: 'Some, but fully payable', value: 'yes', next: 'assets-check' },
    ],
  },
  'close-4': {
    question: 'All tax returns and BAS lodgements up to date?',
    options: [
      { label: 'Yes', value: 'yes', next: 'done' },
      { label: 'No', value: 'no', next: 'done' },
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
      { label: 'Still viable, worth exploring', value: 'viable', next: 'assets-check' },
      { label: 'Time to close it down', value: 'close', next: 'assets-check' },
      { label: 'Not sure', value: 'notsure', next: 'assets-check' },
    ],
  },
  'assets-check': {
    question: 'Roughly what are the company’s assets worth?',
    options: [
      { label: 'Under $1,000', value: 'under1000', next: 'route-after-assets' },
      { label: '$1,000\u2013$10,000', value: '1kto10k', next: 'route-after-assets' },
      { label: '$10,000\u2013$100,000', value: '10kto100k', next: 'route-after-assets' },
      { label: 'Over $100,000', value: 'over100k', next: 'route-after-assets' },
    ],
  },
};

// A couple of screens branch on more than a fixed "next" value.
function resolveAfterLodgements(a) {
  const sbrEligible = a.debtScale === 'under' && a.entitlementsOk === 'yes' && a.lodgementsOk === 'yes';
  return sbrEligible ? 'assets-check' : 'viability-check';
}

function resolveAfterAssets(a) {
  // Only the solvent close-down path still needs the lodgements question —
  // every other path (including the insolvent close-down path) already
  // covered it through the shared eligibility questions, so asking again
  // here would just repeat the same question in different words.
  if (a.category === 'close' && a.closeSolvency === 'yes') return 'close-4';
  return 'context-check';
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
    return { notice: NOTICE_INFO[noticeKey], pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null, pathwayKey };
  }

  // Close branch
  if (a.closeSolvency !== undefined) {
    if (a.closeSolvency === 'yes') {
      if (a.closeStoppedTrading === 'no') return { close: CLOSE_INFO.stillTrading, pathwayKey: null };
      if (a.closeDebts === 'no' && a.assetsValue === 'under1000' && a.closeLodgements === 'yes') {
        return { close: CLOSE_INFO.simple, pathwayKey: 'simple-close' };
      }
      return { close: CLOSE_INFO.mvl, pathwayKey: 'mvl' };
    }
    const pathwayKey = getPathwayKey(a);
    return { pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null, pathwayKey };
  }

  // Worried/debts branch
  if (a.worriedSuper) {
    if (a.worriedSuper === 'current' && a.worriedSuppliers === 'normal') return { calm: CALM_INFO.low, pathwayKey: null };
    if (a.worriedSuper === 'current' && a.worriedSuppliers === 'stretched') return { calm: CALM_INFO.mild, pathwayKey: null };
    if (a.worriedSuper === 'behind' && a.superBehindLength === 'short') return { calm: CALM_INFO.mild, pathwayKey: null };
    const pathwayKey = getPathwayKey(a);
    return { pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null, pathwayKey };
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
   Anonymous-answers-through-login handling. Someone can answer every
   triage question with no account at all — the moment they try to
   book, if they're not logged in, their answers get held in the
   browser (not sent anywhere) until an account exists to attach them
   to. Expires after 24 hours so old, abandoned attempts don't
   resurface confusingly much later.
--------------------------------------------------------------- */
const PENDING_KEY = 'anteroom_pending_booking';

function savePendingBooking(practitionerId, answers) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ practitionerId, answers, savedAt: Date.now() }));
  } catch {
    // Storage can fail (private browsing, disabled, full) — worst case
    // the person just re-answers the questions, nothing crashes.
  }
}

function loadPendingBooking() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearPendingBooking() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // nothing to do if this fails — it'll just expire naturally after 24h
  }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--brand)' }}>
        <Clock size={13} /> Next available: {p.next}
      </div>
      <button className="ar-btn-primary" onClick={() => onBook(p)}>Book consultation</button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Screens
--------------------------------------------------------------- */
function HomeScreen({ onStart, reason, setReason, location, setLocation, onSearch }) {
  return (
    <>
      <div className="ar-hero">
        <div className="ar-hero-inner">
          <h1 className="ar-hero-headline">Know before<br />you call.</h1>
          <p className="ar-hero-sub">
            A free, two-minute check that tells you plainly what your situation means, and connects
            you with the right verified professional — already briefed, before you speak.
          </p>
          <button className="ar-hero-cta" onClick={onStart}>
            Start the free check <Search size={16} />
          </button>
          <div className="ar-hero-meta">No account needed to answer. Two minutes, honestly.</div>

          <details className="ar-secondary-search">
            <summary>Already know who you're looking for? Search directly</summary>
            <div className="ar-searchbar">
              <div className="ar-search-field">
                <Search size={16} style={{ color: 'var(--ink-soft)' }} />
                <Dropdown
                  value={reason}
                  onChange={setReason}
                  placeholder="What's going on?"
                  options={REASONS.map((r) => ({ value: r.id, label: r.label }))}
                />
              </div>
              <div className="ar-search-divider" />
              <div className="ar-search-field">
                <MapPin size={16} style={{ color: 'var(--ink-soft)' }} />
                <input placeholder="Suburb or postcode" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <button className="ar-search-btn" onClick={onSearch}>
                <Search size={15} /> Search
              </button>
            </div>
          </details>
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
          <ShieldCheck size={22} style={{ color: 'var(--brand)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Every practitioner is registered and verified</p>
        </div>
        <div>
          <Clock size={22} style={{ color: 'var(--brand)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Book a consultation online, no phone call needed</p>
        </div>
        <div>
          <FileText size={22} style={{ color: 'var(--brand)' }} />
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Share your documents ahead, so your first meeting isn&apos;t a cold start</p>
        </div>
      </div>
    </>
  );
}

// The actual first question of the check — presented as its own focused
// moment, not competing with a search bar for attention.
function ReasonSelectScreen({ onPick, onBack }) {
  return (
    <div className="ar-section ar-quiz-step" style={{ maxWidth: 480 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1.25rem' }} onClick={onBack}>&larr; Back</button>
      <h2 style={{ marginBottom: '1.1rem' }}>What&apos;s going on?</h2>
      <div className="ar-chip-row" style={{ flexDirection: 'column' }}>
        {REASONS.map((r) => (
          <button key={r.id} className="ar-chip" style={{ textAlign: 'left', borderRadius: 10, padding: '0.9rem 1.1rem' }} onClick={() => onPick(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div style={{ height: 4, background: 'var(--line)', borderRadius: 4, marginBottom: '1.5rem', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(progress, 1) * 100}%`, background: 'var(--brand)', borderRadius: 4, transition: 'width 0.3s ease' }} />
    </div>
  );
}

function TriageScreen({ step, onAnswer, onBack, progress }) {
  const q = TRIAGE[step];
  return (
    <div className="ar-section ar-quiz-step" style={{ maxWidth: 480 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back</button>
      <ProgressBar progress={progress} />
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

function CompactChoice({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p className="ar-label" style={{ marginBottom: '0.5rem' }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map((opt) => (
          <button
            key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`ar-chip ${value === opt.value ? 'active' : ''}`}
            style={{ borderRadius: 999, fontSize: '0.86rem' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Combines what were three separate full-screen questions into one screen —
// these three are all quick, similarly-weighted context questions, so
// asking them together genuinely feels shorter without losing any data.
function ContextScreen({ onAnswer, onBack, progress }) {
  const [loanAccount, setLoanAccount] = useState('');
  const [creditorCount, setCreditorCount] = useState('');
  const [securityInterest, setSecurityInterest] = useState('');
  const canContinue = loanAccount && creditorCount && securityInterest;

  return (
    <div className="ar-section ar-quiz-step" style={{ maxWidth: 480 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back</button>
      <ProgressBar progress={progress} />
      <h2 style={{ marginBottom: '0.3rem' }}>A few more quick details</h2>
      <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1.25rem' }}>
        Three short ones, then you're done.
      </p>

      <CompactChoice
        label="Do you personally owe the company money, or does the company owe you?"
        value={loanAccount} onChange={setLoanAccount}
        options={[
          { label: 'I owe the company', value: 'directorOwes' },
          { label: 'The company owes me', value: 'companyOwes' },
          { label: 'Neither', value: 'neither' },
          { label: 'Not sure', value: 'notsure' },
        ]}
      />
      <CompactChoice
        label="Roughly how many people or businesses does the company owe money to?"
        value={creditorCount} onChange={setCreditorCount}
        options={[
          { label: 'One or two', value: 'few' },
          { label: 'A handful', value: 'some' },
          { label: 'Many', value: 'many' },
        ]}
      />
      <CompactChoice
        label="Has anyone registered a formal claim over your assets? (Sometimes called a PPSR registration.)"
        value={securityInterest} onChange={setSecurityInterest}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Not sure', value: 'notsure' },
        ]}
      />

      <button
        className="ar-btn-primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : 0.5 }}
        onClick={() => onAnswer({ loanAccount, creditorCount, securityInterest })}
      >
        Continue
      </button>
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
          <span style={{ fontWeight: 300, color: remaining <= 5 ? 'var(--clay)' : 'var(--brand)' }}>
            {remaining > 0 ? `${remaining} days left` : 'Window may have passed — get advice today'}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ type, setType, onBook, result }) {
  const [view, setView] = useState('list');
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
        <div className="ar-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--brand)' }}>
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

      {result && (
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          This assessment is general information only and is not financial, legal, accounting or
          insolvency advice. It does not determine whether your company is insolvent or recommend
          that you enter any particular insolvency process. You should obtain independent
          professional advice regarding your circumstances.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div className="ar-type-row" style={{ marginBottom: 0 }}>
          {TYPES.map((t) => (
            <button key={t} className={`ar-type-chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className={`ar-type-chip ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
          <button className={`ar-type-chip ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>Map</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="ar-grid">
          {filtered.map((p) => <PractitionerCard key={p.id} p={p} onBook={onBook} />)}
        </div>
      ) : (
        <PractitionerMap practitioners={filtered} onBook={onBook} />
      )}
    </div>
  );
}

function BookingScreen({ practitioner, onConfirm, onBack, restored }) {
  const [slot, setSlot] = useState(null);
  const slots = ['9:00 AM', '11:30 AM', '2:00 PM', '4:15 PM'];
  return (
    <div className="ar-section" style={{ maxWidth: 520 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back to results</button>
      {restored && (
        <div className="ar-card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--sage)' }}>
          <p style={{ margin: 0, fontSize: '0.86rem' }}>
            Welcome back — your earlier answers are still here. Just pick a time to continue.
          </p>
        </div>
      )}
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);

  function handleFiles(e) {
    const chosen = Array.from(e.target.files || []);
    setFiles((f) => [...f, ...chosen.map((c) => c.name)]);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await onDone({ noticeType, noticeDate: noticeDate || null, notes });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // on success, the parent switches screens — nothing else to do here
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

      {error && <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{error}</p>}

      <button className="ar-btn-primary" disabled={!consent || submitting} style={{ opacity: consent ? 1 : 0.5 }} onClick={handleConfirm}>
        {submitting ? 'Confirming...' : 'Confirm booking'}
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
  const router = useRouter();
  const [screen, setScreen] = useState('home');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('All');
  const [practitioner, setPractitioner] = useState(null);
  const [slot, setSlot] = useState(null);
  const [answers, setAnswers] = useState({});
  const [triageStep, setTriageStep] = useState(null);
  const [restored, setRestored] = useState(false);

  function pickReason(r) {
    setAnswers((a) => ({ ...a, category: r }));
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
    'close-4': 'closeLodgements',
    'scale-check': 'debtScale',
    'entitlements-check': 'entitlementsOk',
    'lodgements-check': 'lodgementsOk',
    'viability-check': 'viability',
    'assets-check': 'assetsValue',
    'loan-account-check': 'loanAccount',
    'creditor-count-check': 'creditorCount',
    'security-check': 'securityInterest',
  };

  function answerTriage(step, opt) {
    const key = KEY_MAP[step];
    const updated = { ...answers, [key]: opt.value };
    setAnswers(updated);

    let next = opt.next;
    if (next === 'route-after-lodgements') next = resolveAfterLodgements(updated);
    if (next === 'route-after-assets') next = resolveAfterAssets(updated);

    if (next === 'done') {
      setScreen('results');
    } else {
      setTriageStep(next);
    }
  }

  // The combined context screen answers three fields at once rather than
  // one, so it has its own handler instead of going through answerTriage.
  function answerContext({ loanAccount, creditorCount, securityInterest }) {
    setAnswers((a) => ({ ...a, loanAccount, creditorCount, securityInterest }));
    setScreen('results');
  }

  // Rough, approximate progress through the current branch — not a precise
  // step count (the real length varies by path), just enough to give a
  // genuine sense of "getting somewhere" rather than an open-ended list.
  const APPROX_MAX_STEPS = 8;
  const triageProgress = Math.max(
    0.08,
    (Object.keys(answers).filter((k) => k !== 'category').length) / APPROX_MAX_STEPS
  );

  const result = getResult(answers);

  // A short, plain-English line summarising the result, stored alongside
  // the full answers so a practitioner (or the client) can read it at a
  // glance without parsing the raw question data.
  function getResultSummary(r) {
    if (!r) return null;
    return r.notice?.title || r.pathway?.title || r.close?.title || r.calm?.title || null;
  }

  function goHome() {
    setScreen('home');
    setAnswers({});
    setTriageStep(null);
  }

  // Booking requires a real account, since the whole point is linking the
  // triage answers to a specific client — check auth before letting anyone
  // past the results screen. If they're not logged in, hold their answers
  // in the browser rather than losing them, so they pick up right where
  // they left off once they've logged in or verified a new account.
  async function handleBook(p) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      savePendingBooking(p.id, answers);
      router.push('/login');
      return;
    }
    setPractitioner(p);
    setScreen('booking');
  }

  // Runs once on load — catches someone landing back on the homepage
  // already authenticated (either just logged in, or just clicked a real
  // email verification link) with answers still waiting to be resumed.
  useEffect(() => {
    async function tryRestore() {
      const pending = loadPendingBooking();
      if (!pending) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // not authenticated yet — nothing to restore

      const foundPractitioner = PRACTITIONERS.find((p) => p.id === pending.practitionerId);
      if (!foundPractitioner) {
        clearPendingBooking();
        return;
      }

      setAnswers(pending.answers);
      setPractitioner(foundPractitioner);
      setScreen('booking');
      setRestored(true);
      clearPendingBooking();
    }
    tryRestore();
  }, []);

  // The actual database write — everything the client answered, plus what
  // they added in the portal step, saved as one real appointment row.
  async function handleConfirmBooking(portalData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return { error: 'You were logged out — please log in again.' };
    }

    const { error } = await supabase.from('appointments').insert({
      client_id: user.id,
      practitioner_id: practitioner.id,
      slot_time: slot,
      notice_type: portalData.noticeType || null,
      notice_date: portalData.noticeDate,
      notes: portalData.notes || null,
      pathway: result?.pathwayKey || null,
      triage_answers: answers,
      triage_summary: getResultSummary(result),
    });

    if (error) {
      return { error: error.message };
    }

    setScreen('confirmed');
    return { error: null };
  }

  return (
    <div className="ar-root">
      <Header />

      {screen === 'home' && (
        <HomeScreen
          onStart={() => setScreen('reason-select')}
          onSearch={() => pickReason(reason)}
          reason={reason} setReason={setReason}
          location={location} setLocation={setLocation}
        />
      )}
      {screen === 'reason-select' && (
        <ReasonSelectScreen key="reason-select" onPick={pickReason} onBack={goHome} />
      )}
      {screen === 'triage' && triageStep === 'context-check' && (
        <ContextScreen key="context-check" onAnswer={answerContext} onBack={goHome} progress={triageProgress} />
      )}
      {screen === 'triage' && triageStep !== 'context-check' && (
        <TriageScreen key={triageStep} step={triageStep} onAnswer={answerTriage} onBack={goHome} progress={triageProgress} />
      )}
      {screen === 'results' && (
        <ResultsScreen type={type} setType={setType} result={result} onBook={handleBook} />
      )}
      {screen === 'booking' && (
        <BookingScreen practitioner={practitioner} restored={restored} onBack={() => setScreen('results')} onConfirm={(s) => { setSlot(s); setScreen('portal'); }} />
      )}
      {screen === 'portal' && (
        <PortalScreen practitioner={practitioner} onBack={() => setScreen('booking')} onDone={handleConfirmBooking} />
      )}
      {screen === 'confirmed' && (
        <ConfirmedScreen practitioner={practitioner} slot={slot} onHome={goHome} />
      )}

      <Footer />
    </div>
  );
}
