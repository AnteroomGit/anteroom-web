'use client';

import { useState, useEffect, useId, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ShieldCheck, Clock, Check } from 'lucide-react';
import Footer from './Footer';
import Header from './Header';
import Dropdown from './Dropdown';
import NotifyForm from './NotifyForm';
import { REASONS } from '../constants';
import { GUIDES } from '../../lib/guides';
import { supabase } from '../../lib/supabase';
import { ensureClientRow } from '../../lib/ensureClient';
import { refreshAccount } from '../../lib/account';
import { PENDING_BOOKING_KEY, PENDING_CLASS, PENDING_TIMEOUT_MS, readSessionHint } from '../../lib/sessionHint';
import dynamic from 'next/dynamic';

// Leaflet touches window/document directly, so it can only run in the
// browser. Dynamic import with ssr:false keeps it out of the server
// render entirely, avoiding a "window is not defined" build error.
const PractitionerMap = dynamic(() => import('./PractitionerMap'), { ssr: false });

/* ---------------------------------------------------------------
   Data
--------------------------------------------------------------- */
// Only liquidators are being onboarded right now, so a filter row showing
// four other categories with zero practitioners in them is confusing
// clutter, not real choice. Expand this once other types actually exist.
const TYPES = ['All', 'Liquidator'];

const NOTICE_OPTIONS = ['Director Penalty Notice', 'Garnishee notice', 'Statutory demand', 'Not sure'];


const QUICK_LINKS = [
  { label: 'Director Penalty Notice', category: 'ato' },
  { label: 'Statutory demand', category: 'ato' },
  { label: 'Garnishee notice', category: 'ato' },
  { label: "Can't pay super", category: 'money' },
  { label: 'Worried about cash flow', category: 'money' },
  { label: 'Voluntary deregistration', category: 'close' },
];

/* ---------------------------------------------------------------
   Triage question flow: short, sharp, one tap each.
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
      { label: '2 to 6 weeks', value: 'medium', next: 'scale-check' },
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
      { label: '$1,000 to $10,000', value: '1kto10k', next: 'route-after-assets' },
      { label: '$10,000 to $100,000', value: '10kto100k', next: 'route-after-assets' },
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
  // Only the solvent close-down path still needs the lodgements question.
  // every other path (including the insolvent close-down path) already
  // covered it through the shared eligibility questions, so asking again
  // here would just repeat the same question in different words.
  if (a.category === 'close' && a.closeSolvency === 'yes') return 'close-4';
  return 'context-check';
}

const REASON_START = { ato: 'notice-type', money: 'worried-1', debts: 'worried-1', close: 'close-solvency' };

/* ---------------------------------------------------------------
   Outcome copy: urgency (the specific notice) and pathway
   (the formal mechanism, if any) are shown as two separate,
   honest pieces rather than one blended verdict.
--------------------------------------------------------------- */
const NOTICE_INFO = {
  dpnNonLockdown: { urgent: true, title: 'Non-lockdown Director Penalty Notice', text: 'You have 21 days from the date on the notice to pay in full or appoint a practitioner. Either stops personal liability attaching.', deadlineDays: 21 },
  dpnLockdown: { urgent: true, title: 'Lockdown Director Penalty Notice', text: 'Because lodgements were late, personal liability has already attached. This is about your options from here, not preventing it.' },
  dpnUnsure: { urgent: true, title: 'Director Penalty Notice, type unclear', text: 'Whether you have 21 days or none depends on one fact you don’t currently know, worth getting the actual notice checked quickly.' },
  garnishee: { urgent: true, title: 'Garnishee notice', text: 'This is already redirecting your cash, not a future risk.' },
  statutory: { urgent: true, title: 'Statutory demand', text: 'You have 21 days to pay or apply to set it aside. No action means the company can be presumed insolvent.', deadlineDays: 21 },
  noticeUnsure: { urgent: true, title: 'Notice received, type unclear', text: 'Different notices carry very different deadlines, worth confirming which one this is quickly.' },
};

const PATHWAY_INFO = {
  sbr: {
    label: 'Likely eligible',
    title: 'Small Business Restructuring may be a strong option',
    text: 'You keep running the business day to day while a registered practitioner helps put together a formal plan for what’s owed. Creditors vote on it. If approved, you keep trading under it. A practitioner will confirm the finer eligibility details, including whether SBR has been used in the last 7 years.',
  },
  va: {
    label: 'Worth exploring',
    title: 'Voluntary Administration is likely worth exploring',
    text: 'Small Business Restructuring probably isn’t available here, but that doesn’t mean the business is finished. An administrator pauses creditor action while properly assessing options. It can still lead to a plan that keeps the business going, not just a wind-up.',
  },
  cvl: {
    label: 'An orderly path',
    title: 'Creditors Voluntary Liquidation may be the right path',
    text: 'If the business genuinely isn’t viable to continue, a director-led, orderly wind-up is often the most responsible next step, not a failure, a properly managed close.',
  },
};

const CLOSE_INFO = {
  simple: { title: 'Voluntary deregistration looks like a fit', text: 'Stopped trading, no debts, minimal assets, lodgements current, that matches ASIC’s criteria for a simple, self-serve close via Form 6010.' },
  mvl: { title: 'Members Voluntary Liquidation looks like the right fit', text: 'Because the business is solvent, this isn’t really an insolvency situation. An MVL is the formal, orderly way to close a solvent company and distribute what’s left to shareholders.' },
  stillTrading: { title: 'One step before this applies', text: 'Closing down only applies once trading has genuinely stopped. Come back through once that’s the case.' },
};

const CALM_INFO = {
  low: { title: 'No red flags right now', text: 'Notice, super, and supplier terms are all clear. Worth revisiting if anything changes.' },
  mild: { title: 'Worth a proactive look, not urgent', text: 'A short delay here and there is common and rarely a crisis on its own, worth a light check-in, nothing more urgent than that.' },
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
    return { notice: NOTICE_INFO[noticeKey], noticeKey, pathway: pathwayKey ? PATHWAY_INFO[pathwayKey] : null, pathwayKey };
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
   triage question with no account at all. The moment they try to
   book, if they're not logged in, their answers get held in the
   browser (not sent anywhere) until an account exists to attach them
   to. Expires after 24 hours so old, abandoned attempts don't
   resurface confusingly much later.
--------------------------------------------------------------- */
const PENDING_KEY = PENDING_BOOKING_KEY;

function savePendingBooking(practitionerId, answers) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ practitionerId, answers, savedAt: Date.now() }));
  } catch {
    // Storage can fail (private browsing, disabled, full). Worst case
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
    // nothing to do if this fails. It'll just expire naturally after 24h
  }
}

// useSyncExternalStore wants a subscribe function. Nothing it reads changes
// while the page is open, so there is nothing to listen to.
function subscribeNoop() {
  return () => {};
}

// Creates the missing client row for someone who signed in with Google or
// Apple, and tells the header about it if it did. Never throws.
async function ensureClient(user) {
  const outcome = await ensureClientRow(supabase, user);
  if (outcome.created) refreshAccount();
  return outcome;
}

// "2026-10-16" -> "Friday 16 October". Built from the parts so the
// browser's time zone cannot move the date by a day.
function formatPreferredDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/* ---------------------------------------------------------------
   Small components
--------------------------------------------------------------- */
export function PractitionerCard({ p, onBook }) {
  return (
    <div className="ar-card">
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {p.avatar_url ? (
          <img
            src={p.avatar_url} alt={p.name}
            style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="ar-avatar">{p.initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', lineHeight: 1.25 }}>{p.name}</div>
          {p.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--sage)', fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: '0.1rem' }}>
              <ShieldCheck size={15} aria-hidden="true" /> Verified
            </div>
          )}
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>{p.title}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>{p.firm}</div>
          {p.contact_preference && p.contact_preference !== 'either' && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', marginTop: '0.2rem' }}>
              Prefers {p.contact_preference === 'call' ? 'a call' : 'email'} first
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--line)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
          <MapPin size={16} aria-hidden="true" /> {p.suburb}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {p.tags.map((t) => <span key={t} className="ar-tag">{t}</span>)}
        </div>
        {p.next && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
            <Clock size={16} aria-hidden="true" /> Next available: {p.next}
          </div>
        )}
      </div>
      <button className="ar-btn-primary ar-card-action" onClick={() => onBook(p)}>Request a consultation</button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Screens
--------------------------------------------------------------- */
function HomeScreen({ onStart, reason, setReason, location, setLocation, onSearch, onQuickLink, firstName, isPractitioner }) {
  return (
    <>
      <div className="ar-hero">
        <div className="ar-hero-grid">
          <div className="ar-hero-inner">
            {firstName ? (
              <>
                <h1 className="ar-hero-headline">Welcome back, {firstName}.</h1>
                <p className="ar-hero-sub">
                  It is the same free, two-minute check as before, in plain English. Funded by
                  practitioners, <a href="/how-we-work">never by you</a>.
                </p>
              </>
            ) : (
              <>
                <h1 className="ar-hero-headline">Got a Director Penalty Notice or ATO debt? Find out where you stand.</h1>
                <p className="ar-hero-sub">
                  Answer a few questions and get a plain-English read on your situation. If you want
                  to talk to someone, you can ask a verified registered liquidator for a
                  consultation, and they will already have your answers. Funded by practitioners,{' '}
                  <a href="/how-we-work">never by you</a>.
                </p>
              </>
            )}
            <button className="ar-hero-cta" onClick={onStart}>
              {firstName ? 'Answer the questions' : 'Start the free check'} <span aria-hidden="true">&rarr;</span>
            </button>
            {!firstName && <p className="ar-hero-meta">Free for directors. About two minutes. No account needed.</p>}

            <details className="ar-secondary-search">
              <summary>Already know who you&apos;re looking for? Search directly</summary>
              <div className="ar-searchbar">
                <div className="ar-search-field">
                  <Search size={19} style={{ color: 'var(--ink-soft)' }} />
                  <Dropdown
                    value={reason}
                    onChange={setReason}
                    placeholder="What's going on?"
                    options={REASONS.map((r) => ({ value: r.id, label: r.label }))}
                  />
                </div>
                <div className="ar-search-divider" />
                <div className="ar-search-field">
                  <MapPin size={19} style={{ color: 'var(--ink-soft)' }} />
                  <input placeholder="Suburb or postcode" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <button className="ar-search-btn" onClick={onSearch}>
                  <Search size={18} /> Search
                </button>
              </div>
            </details>
          </div>

          <div className="ar-situations">
            <h2 className="ar-situations-title">What&apos;s going on?</h2>
            {QUICK_LINKS.map((q) => (
              <button key={q.label} className="ar-situation" onClick={() => onQuickLink(q.category)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ar-band ar-band-paper ar-home-band">
        <div className="ar-wrap">
          <div className="ar-row">
            <div className="ar-row-head"><h2>How it works</h2></div>
            <ol className="ar-steps">
              <li>
                <div>
                  <h3>Answer a few questions</h3>
                  <p>One tap each, about two minutes. You do not need an account to see your result.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Read your result</h3>
                  <p>
                    You get a plain-English read of your notice, the deadline that applies and the
                    option that usually fits. It is general information, not advice.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Ask for a consultation if you want one</h3>
                  <p>
                    Choose a verified registered liquidator and send a request. They see your answers
                    first, so you do not start from zero.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="ar-band ar-band-white ar-home-band">
        <div className="ar-wrap">
          <div className="ar-row">
            <div className="ar-row-head"><h2>What you should know</h2></div>
            <dl className="ar-facts">
              <div>
                <dt>It is free for you</dt>
                <dd>
                  Directors never pay AnteRoom. Practitioners pay a flat membership fee that does not
                  depend on how many directors they meet, so nobody can buy a better place in your
                  results. <a href="/how-we-work">How we work</a>
                </dd>
              </div>
              <div>
                <dt>Liquidators are checked</dt>
                <dd>
                  Each one is checked against ASIC&apos;s register of registered liquidators before their
                  profile appears. Verified means the registration is real. It does not mean AnteRoom
                  vouches for their advice.
                </dd>
              </div>
              <div>
                <dt>Your answers go with you</dt>
                <dd>
                  If you ask for a consultation, the liquidator sees your answers and a short summary
                  first. Nothing is sent until you ask.
                </dd>
              </div>
              <div>
                <dt>It is not advice</dt>
                <dd>
                  AnteRoom gives general information. It cannot tell you whether your company is
                  insolvent or what to do about it. A liquidator, accountant or lawyer can.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="ar-homepage-result-preview ar-dark">
        <div className="ar-result-preview-inner">
          <div>
            <h2>What the check tells you</h2>
            <p>
              A plain-English read of your notice, the deadline that applies and the option that
              usually fits. This is an example, not a real result.
            </p>
          </div>
          <div className="ar-result-banner-on-dark">
            <span className="ar-result-label" style={{ color: 'var(--brand)' }}>Example result</span>
            <p className="ar-result-title">Small Business Restructuring may be a strong option</p>
            <p className="ar-result-text">
              Your lodgements are up to date and total debts are under $1 million, so the SBR
              pathway is likely available. Here&apos;s a verified practitioner who can walk you
              through it.
            </p>
          </div>
        </div>
      </div>

      <div className="ar-band ar-band-paper ar-home-band">
        <div className="ar-wrap">
          <div className="ar-row">
            <div className="ar-row-head">
              <h2>Guides</h2>
              <p>Plain-English explainers for directors dealing with the ATO, with sources.</p>
            </div>
            <div>
              <ul className="ar-guides">
                {GUIDES.map((g) => (
                  <li key={g.slug}>
                    <a href={`/guides/${g.slug}`}>
                      <span className="ar-guides-title">{g.title}</span>
                      <span className="ar-guides-desc">{g.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <a className="ar-more-link" href="/guides">All guides</a>
            </div>
          </div>
        </div>
      </div>

      <div className="ar-practitioner-banner">
        {isPractitioner ? (
          <span>You&apos;re already listed. Head to your <a href="/practitioner/dashboard" className="ar-practitioner-banner-cta">dashboard</a>.</span>
        ) : (
          <>
            <span>Registered liquidator?</span>
            <a href="/for-practitioners" className="ar-practitioner-banner-cta">List your practice</a>
          </>
        )}
      </div>
    </>
  );
}

// The actual first question of the check. Presented as its own focused
// moment, not competing with a search bar for attention.
function ReasonSelectScreen({ onPick, onBack }) {
  return (
    <div className="ar-section ar-quiz-step" style={{ maxWidth: 480 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1.25rem' }} onClick={onBack}>&larr; Back</button>
      <h2 style={{ marginBottom: '1.1rem' }}>What&apos;s going on?</h2>
      <div className="ar-chip-row" style={{ flexDirection: 'column' }}>
        {REASONS.map((r) => (
          <button key={r.id} className="ar-chip" onClick={() => onPick(r.id)}>
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
      {q.subtext && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1.1rem' }}>{q.subtext}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: q.subtext ? 0 : '1.1rem' }}>
        {q.options.map((opt) => (
          <button key={opt.value} className="ar-chip" onClick={() => onAnswer(step, opt)}>
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
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Combines what were three separate full-screen questions into one screen.
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
      <h2 style={{ marginBottom: '1.25rem' }}>A few more quick details</h2>

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
          { label: '1 or 2', value: 'few' },
          { label: '3 to 10', value: 'some' },
          { label: 'More than 10', value: 'many' },
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
      <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', margin: '0 0 0.5rem' }}>See exactly how many days you have left</p>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" className="ar-input" style={{ maxWidth: 180 }} value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        {remaining !== null && (
          <span style={{ fontWeight: 600, color: remaining <= 5 ? 'var(--clay)' : 'var(--brand)' }}>
            {remaining > 0 ? `${remaining} days left` : 'Window may have passed. Get advice today'}
          </span>
        )}
      </div>
    </div>
  );
}

// The guides that explain what a result is about, so someone who has just been
// told what they have received can read the detail before they decide anything.
// At most three, and the checklist for the first conversation is always last.
function guidesForResult(result) {
  if (!result) return [];
  const slugs = [];
  const key = result.noticeKey || '';
  if (key.startsWith('dpn')) slugs.push('director-penalty-notice');
  if (key === 'statutory') slugs.push('statutory-demand');
  if (result.pathwayKey === 'sbr') slugs.push('small-business-restructuring');
  if (result.pathwayKey === 'va' || result.pathwayKey === 'cvl') slugs.push('what-a-liquidator-does');
  slugs.push('before-you-speak-to-a-liquidator');
  return [...new Set(slugs)].slice(0, 3).map((slug) => GUIDES.find((g) => g.slug === slug)).filter(Boolean);
}

function ResultsScreen({ type, setType, onBook, result, returning, onStartNew, practitioners }) {
  const [view, setView] = useState('list');
  const filtered = type === 'All' ? practitioners : practitioners.filter((p) => p.type === type);
  const guideLinks = guidesForResult(result);
  return (
    <div className="ar-section ar-results-reveal">
      {returning && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
          These are your answers from last time.{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onStartNew(); }} style={{ color: 'var(--brand)' }}>
            Start a new check
          </a> if your situation&apos;s changed.
        </p>
      )}
      {result?.notice && (
        <div className="ar-result-banner" style={{ borderLeftColor: 'var(--clay)' }}>
          <p className="ar-result-title">{result.notice.title}</p>
          <p className="ar-result-text">{result.notice.text}</p>
          {result.notice.deadlineDays && <DeadlineCalculator days={result.notice.deadlineDays} />}
        </div>
      )}
      {result?.pathway && (
        <div className="ar-result-banner" style={{ borderLeftColor: 'var(--brand)' }}>
          <span className="ar-result-label" style={{ color: 'var(--brand)' }}>{result.pathway.label}</span>
          <p className="ar-result-title">{result.pathway.title}</p>
          <p className="ar-result-text">{result.pathway.text}</p>
        </div>
      )}
      {result?.close && (
        <div className="ar-result-banner" style={{ borderLeftColor: 'var(--sage)' }}>
          <p className="ar-result-title">{result.close.title}</p>
          <p className="ar-result-text">{result.close.text}</p>
        </div>
      )}
      {result?.calm && (
        <div className="ar-result-banner" style={{ borderLeftColor: 'var(--sage)' }}>
          <p className="ar-result-title">{result.calm.title}</p>
          <p className="ar-result-text">{result.calm.text}</p>
        </div>
      )}

      {result && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          This assessment is general information only and is not financial, legal, accounting or
          insolvency advice. It does not determine whether your company is insolvent or recommend
          that you enter any particular insolvency process. You should obtain independent
          professional advice regarding your circumstances.
        </p>
      )}

      {guideLinks.length > 0 && (
        <div className="ar-result-guides">
          <p className="ar-label">Read more</p>
          <ul>
            {guideLinks.map((g) => (
              <li key={g.slug}><a href={`/guides/${g.slug}`}>{g.title}</a></li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-soft)', marginBottom: '1.25rem' }}>
        These are the verified practitioners currently in our network. Where someone appears in
        this list is never affected by what they pay.{' '}
        <a href="/how-we-work" style={{ color: 'var(--brand)' }}>How we work</a>
      </p>

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

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontWeight: 700, fontSize: 'var(--text-md)', margin: '0 0 0.6rem' }}>
            We&apos;re onboarding verified practitioners in Victoria right now
          </p>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-soft)', margin: '0 auto 1.5rem', maxWidth: 420 }}>
            AnteRoom is early. Your triage result above is genuine, but there isn&apos;t a practitioner
            to request a consultation with in this category yet. Leave your email and we&apos;ll
            write to you when someone verified is listed.
          </p>
          <NotifyForm />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', margin: '1.75rem auto 0', maxWidth: 420, lineHeight: 1.55 }}>
            While you wait, ASIC publishes free guidance for directors in financial difficulty:{' '}
            <a
              href="https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors"
              target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}
            >
              Insolvency for directors<span className="ar-sr-only"> (opens in a new tab)</span>
            </a>.
          </p>
        </div>
      ) : view === 'list' ? (
        <div className="ar-grid">
          {filtered.map((p) => <PractitionerCard key={p.id} p={p} onBook={onBook} />)}
        </div>
      ) : (
        <PractitionerMap practitioners={filtered} onBook={onBook} />
      )}
    </div>
  );
}

const TIME_SLOTS = ['9:00 AM', '11:30 AM', '2:00 PM', '4:15 PM'];

// Tomorrow's date in the visitor's own time zone, as the "YYYY-MM-DD" text a
// date field wants. (toISOString uses UTC, which for most of an Australian
// morning is still yesterday.)
function localTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Asking for a time is a request, not a booking. The practitioner has not
// agreed to anything yet, and the times below are not their real diary, so
// the screen says so plainly.
function BookingScreen({ practitioner, onConfirm, onBack, restored }) {
  const dateId = useId();
  const timeLabelId = useId();
  const [slot, setSlot] = useState(null);
  const [date, setDate] = useState('');
  const tomorrow = localTomorrowISO();
  return (
    <div className="ar-section" style={{ maxWidth: 520 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back to results</button>
      {restored && (
        <div className="ar-card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--sage)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
            Welcome back. Your earlier answers are still here. Just pick a preferred time to continue.
          </p>
        </div>
      )}
      <div className="ar-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="ar-avatar">{practitioner.initials}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{practitioner.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>{practitioner.title}, {practitioner.firm}</div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', margin: '0 0 1.25rem', lineHeight: 1.55 }}>
        Tell us when you would like to talk. This is a preference only. {practitioner.name} will
        contact you to confirm a time, and nothing is booked until they do.
      </p>
      <label className="ar-label" htmlFor={dateId}>Preferred date</label>
      <input
        id={dateId} type="date" className="ar-input" value={date} min={tomorrow}
        onChange={(e) => setDate(e.target.value)}
        style={{ marginBottom: '1.25rem', maxWidth: 200 }}
      />
      <p className="ar-label" id={timeLabelId}>Preferred time</p>
      <div role="group" aria-labelledby={timeLabelId} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {TIME_SLOTS.map((s) => (
          <div
            key={s} role="button" tabIndex={0} aria-pressed={slot === s}
            className={`ar-slot ${slot === s ? 'active' : ''}`}
            onClick={() => setSlot(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSlot(s); }
            }}
          >
            {s}
          </div>
        ))}
      </div>
      <button className="ar-btn-primary" disabled={!slot || !date} style={{ opacity: slot && date ? 1 : 0.5 }} onClick={() => onConfirm(slot, date)}>
        Continue
      </button>
    </div>
  );
}

function PortalScreen({ practitioner, onDone, onBack }) {
  const noticeTypeId = useId();
  const noticeDateId = useId();
  const notesId = useId();
  const [noticeType, setNoticeType] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await onDone({ noticeType, noticeDate: noticeDate || null, notes });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // on success, the parent switches screens. Nothing else to do here
  }

  return (
    <div className="ar-section" style={{ maxWidth: 560 }}>
      <button className="ar-btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>&larr; Back</button>
      <h2>Before your consultation</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginTop: '-0.6rem', marginBottom: '1.25rem' }}>
        Adding this now means {practitioner.name.split(' ')[0]} can review your situation before you meet, rather than starting cold.
      </p>

      <label className="ar-label" htmlFor={noticeTypeId}>Have you received a notice?</label>
      <select id={noticeTypeId} className="ar-select" value={noticeType} onChange={(e) => setNoticeType(e.target.value)} style={{ marginBottom: '1rem' }}>
        <option value="">Select one</option>
        {NOTICE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        <option value="None">None received</option>
      </select>

      {noticeType && noticeType !== 'None' && (
        <>
          <label className="ar-label" htmlFor={noticeDateId}>Date on the notice</label>
          <input id={noticeDateId} type="date" className="ar-input" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} style={{ marginBottom: '1rem' }} />
        </>
      )}

      {/* This used to be a file picker. It only listed the file names on
          screen and never sent anything, so it is gone until uploads are
          real. The text says so rather than hinting at it. */}
      <p className="ar-label">Documents</p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', margin: '0 0 1rem', lineHeight: 1.55 }}>
        AnteRoom can&apos;t send files to a practitioner yet. Keep your notice and any recent
        financial statements handy to show them when you speak.
      </p>

      <label className="ar-label" htmlFor={notesId}>Anything else worth mentioning?</label>
      <textarea id={notesId} className="ar-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginBottom: '1.1rem' }} />

      <label className="ar-checkbox-row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '0.15rem' }} />
        I consent to this information being shared with {practitioner.name} ahead of our consultation.
      </label>

      {error && <p role="alert" className="ar-error-text">{error}</p>}

      <button className="ar-btn-primary" disabled={!consent || submitting} style={{ opacity: consent ? 1 : 0.5 }} onClick={handleConfirm}>
        {submitting ? 'Sending...' : 'Send request'}
      </button>
    </div>
  );
}

function ConfirmedScreen({ practitioner, slot, date, onHome }) {
  const when = [formatPreferredDate(date), slot].filter(Boolean).join(' at ');
  return (
    <div className="ar-section" style={{ maxWidth: 480, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--sage-tint)', color: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
        <Check size={29} aria-hidden="true" />
      </div>
      <h2>Request sent</h2>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-soft)', marginBottom: '1rem', lineHeight: 1.6 }}>
        Your request and answers have gone to {practitioner.name}, {practitioner.firm}.
        {when ? ` You asked for ${when}.` : ''} That is a preference, so nothing is booked until
        they confirm a time with you.
      </p>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-soft)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        They&apos;ll see it in their AnteRoom dashboard but may not check it straight away. If your
        deadline is close, speak to a registered liquidator or your accountant today as well.
      </p>
      <button className="ar-btn-ghost" onClick={onHome}>Back to home</button>
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
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [triageStep, setTriageStep] = useState(null);
  const [restored, setRestored] = useState(false);
  // Set only when the current 'results' screen is showing a returning,
  // logged-in client's past answers (auto-loaded on landing), rather than
  // a fresh result they just walked through -- changes the copy shown
  // and offers a way to start over instead of resuming a booking.
  const [returningResults, setReturningResults] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [isPractitioner, setIsPractitioner] = useState(false);
  // True until the mount-time account check below has decided what this
  // visitor should see. For someone who looks signed in, the homepage is
  // held back until then: without that, the hero and the practitioner
  // banner showed for a moment and then got swapped or redirected away,
  // which is the visible "flash of the wrong page" a practitioner was
  // seeing.
  //
  // Visitors who do not look signed in are no longer held back. The page
  // is built on the server, so it has to be on screen straight away, and
  // for them there is nothing to wait for. See readSessionHint.
  const [checkingAccount, setCheckingAccount] = useState(true);
  // The server and the first browser render both use `false` here, so the
  // server's HTML and the first browser render always agree. The browser
  // then switches to the real answer straight after.
  const looksSignedIn = useSyncExternalStore(subscribeNoop, readSessionHint, () => false);
  // Real, verified practitioners -- was a hardcoded empty array before
  // tonight, a placeholder from when nobody had signed up yet. Now that
  // real practitioners can actually get verified, this needs to be live
  // data, not a constant nothing could ever be added to.
  const [practitioners, setPractitioners] = useState([]);

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

  // Rough, approximate progress through the current branch. Not a precise
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
    setReturningResults(false);
  }

  // Booking requires a real account, since the whole point is linking the
  // triage answers to a specific client. Check auth before letting anyone
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

  // Ends the account check: shows the homepage and takes off the class that
  // the small script in layout.jsx puts on <html> to hide it on first load.
  function finishCheck() {
    setCheckingAccount(false);
    document.documentElement.classList.remove(PENDING_CLASS);
  }

  // Runs once on load. Four possible reasons someone lands here already
  // authenticated, checked in priority order so they don't conflict:
  // 1) they were mid-triage, hit "book", got sent to log in, and are now
  //    back to resume that exact booking -- takes priority since it's an
  //    action they were actively in the middle of;
  // 2) they're a practitioner -- this whole page is a client-triage
  //    flow they have no reason to see at all, so they're redirected to
  //    their own dashboard immediately, before anything client-specific
  //    below even runs;
  // 3) they've got a real client account with a past appointment on
  //    file -- show their last result directly (reusing the same
  //    ResultsScreen a fresh completion would show) rather than the
  //    generic marketing homepage, since they've already told us what's
  //    going on;
  // 4) they're logged in but have never completed a triage or booking --
  //    just personalise the homepage's greeting, same flow as anyone else.
  useEffect(() => {
    async function tryRestore() {
      // Set when this visitor is being sent to the practitioner dashboard.
      // The page stays hidden until we have actually left.
      let leaving = false;
      try {
        // Fetched first and used directly (not via the practitioners state
        // variable, which wouldn't have updated yet on this same tick) so
        // the pending-booking lookup just below has real data to search,
        // and setPractitioners() still runs so the rest of the render tree
        // (ResultsScreen, the booking screen) gets it too.
        const { data: fetchedPractitioners } = await supabase
          .from('practitioners')
          .select('id, name, firm, practitioner_type, suburb, tags, bio, avatar_url, phone, contact_preference, verified')
          .eq('verified', true);
        const livePractitioners = (fetchedPractitioners || []).map((p) => ({
          ...p,
          // The signup form stores the full descriptive label (good for
          // display, e.g. "Registered Liquidator / SBR Practitioner" as a
          // credential), but the results page's filter chips use the
          // short category name -- this maps one to the other rather than
          // changing what gets stored or displayed.
          type: /liquidator|restructuring/i.test(p.practitioner_type || '') ? 'Liquidator' : p.practitioner_type,
          title: p.practitioner_type,
          tags: p.tags || [],
          // The card renders p.initials as the avatar -- this field never
          // actually existed on real data, only on old hardcoded seed
          // entries, so every real practitioner showed a blank circle
          // until now. Derived from their real name instead.
          initials: (p.name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?',
        }));
        setPractitioners(livePractitioners);

        const pending = loadPendingBooking();
        if (pending) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const foundPractitioner = livePractitioners.find((p) => p.id === pending.practitionerId);
            if (foundPractitioner) {
              setAnswers(pending.answers);
              setPractitioner(foundPractitioner);
              setScreen('booking');
              setRestored(true);
              clearPendingBooking();
              return;
            }
            clearPendingBooking();
          }
          // Not authenticated yet: leave the pending booking in place and
          // fall through to the plain anonymous homepage below.
        }

        // An explicit "start fresh" link (the profile page's "Answer the
        // questions" / "Run the check again") skips straight past the
        // marketing homepage and any auto-loaded past result -- clicking
        // that link means "begin now," not "show me what I said last
        // time," so it takes priority over the returning-results check
        // below.
        const params = new URLSearchParams(window.location.search);
        if (params.get('start') === '1') {
          setScreen('reason-select');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // anonymous visitor: normal marketing homepage, nothing to restore

        // A logged-in practitioner has no reason to see this page at all --
        // they're the ones receiving triage answers, not answering them.
        // Sent straight to their own dashboard, before any of the
        // client-specific lookups below even run.
        const { data: practitionerRow } = await supabase.from('practitioners').select('id').eq('id', user.id).maybeSingle();
        if (practitionerRow) {
          leaving = true;
          setIsPractitioner(true);
          router.push('/practitioner/dashboard');
          // Deliberately not ending the check here -- staying hidden for
          // the moment it takes router.push to actually navigate away is
          // exactly what avoids the flash of homepage content this whole
          // gate exists to prevent. The class on <html> is removed when
          // this page unmounts (see the cleanup below), or by the safety
          // timer below if the navigation never happens.
          return;
        }

        // Someone who signed in with Google or Apple can arrive without a
        // client row. Make one before reading it, so the greeting below and
        // everything saved later has somewhere to land.
        await ensureClient(user);

        const [{ data: profile }, { data: session }, { data: appointments }] = await Promise.all([
          supabase.from('clients').select('first_name').eq('id', user.id).maybeSingle(),
          // The current, always-overwritten snapshot of what someone last
          // answered, independent of whether they ever booked anyone.
          supabase.from('triage_sessions').select('answers').eq('client_id', user.id).maybeSingle(),
          // Falls back to a past booking's answers for anyone who booked
          // before triage_sessions existed, so nobody loses their
          // returning-result experience over this change.
          supabase.from('appointments').select('triage_answers').eq('client_id', user.id)
            .order('created_at', { ascending: false }).limit(1),
        ]);

        if (profile?.first_name) setFirstName(profile.first_name);

        const lastAnswers = (session?.answers && Object.keys(session.answers).length > 0)
          ? session.answers
          : appointments?.[0]?.triage_answers;
        if (lastAnswers && Object.keys(lastAnswers).length > 0) {
          setAnswers(lastAnswers);
          setReturningResults(true);
          setScreen('results');
        }
        // else: logged in, no history yet -- stay on 'home', personalised
        // via firstName above, same as the "answer the questions" case.
      } catch (err) {
        // A failed lookup must never leave the page hidden.
        console.error('Homepage account check failed:', err);
      } finally {
        if (!leaving) finishCheck();
      }
    }
    tryRestore();
    // The same safety net as the script in layout.jsx, on the React side: if
    // the check is slow, or a redirect never completes, the page comes back
    // after the same few seconds instead of staying blank.
    const safety = setTimeout(finishCheck, PENDING_TIMEOUT_MS);
    // Leaving the page by any route must not leave the hide-the-page class
    // behind for the next page to inherit.
    return () => {
      clearTimeout(safety);
      document.documentElement.classList.remove(PENDING_CLASS);
    };
  }, []);

  // Saves a logged-in client's answers the moment they reach a result,
  // regardless of whether they go on to book anyone -- this is the
  // record referenced when generating a report later, not something
  // gated behind booking a consultation first. Anonymous visitors are
  // deliberately left alone here: their answers stay in the browser
  // only, matching what the Privacy Policy already says.
  useEffect(() => {
    async function saveSession() {
      if (screen !== 'results' || !result) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // The saved answers point at the client row, so it has to exist first.
      await ensureClient(user);
      await supabase.from('triage_sessions').upsert(
        {
          client_id: user.id,
          answers,
          summary: getResultSummary(result),
          pathway: result?.pathwayKey || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id' }
      );
    }
    saveSession();
  }, [screen]);

  // The actual database write. Everything the client answered, plus what
  // they added in the portal step, saved as one real appointment row.
  async function handleConfirmBooking(portalData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return { error: 'You were logged out. Please log in again.' };
    }

    // The request points at the client row, so it has to exist first.
    await ensureClient(user);

    const { error } = await supabase.from('appointments').insert({
      client_id: user.id,
      practitioner_id: practitioner.id,
      slot_time: slot,
      appointment_date: appointmentDate,
      notice_type: portalData.noticeType || null,
      notice_date: portalData.noticeDate,
      notes: portalData.notes || null,
      pathway: result?.pathwayKey || null,
      triage_answers: answers,
      triage_summary: getResultSummary(result),
    });

    if (error) {
      // The raw database message means nothing to a director, so keep it
      // for the console and show something they can act on.
      console.error('Could not save the consultation request:', error);
      return { error: 'We could not send your request just now. Please try again in a moment.' };
    }

    setScreen('confirmed');
    return { error: null };
  }

  // The homepage waits for the account check only if the visitor looks
  // signed in. Everyone else, and every search engine, gets it at once.
  const holdHomepage = checkingAccount && looksSignedIn;

  return (
    <div className="ar-root">
      <Header confirmBeforeHome={screen !== 'home' && !returningResults} onConfirmedHome={goHome} />

      {screen === 'home' && holdHomepage && (
        // Blank on purpose, not a spinner. This only ever shows for a beat,
        // and only to someone who looks signed in (see readSessionHint),
        // while the practitioner and pending-booking checks above run.
        <div style={{ minHeight: '60vh' }} />
      )}
      {screen === 'home' && !holdHomepage && (
        <HomeScreen
          onStart={() => setScreen('reason-select')}
          onSearch={() => pickReason(reason)}
          onQuickLink={(category) => pickReason(category)}
          reason={reason} setReason={setReason}
          location={location} setLocation={setLocation}
          firstName={firstName}
          isPractitioner={isPractitioner}
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
        <ResultsScreen
          type={type} setType={setType} result={result} onBook={handleBook}
          returning={returningResults} onStartNew={goHome} practitioners={practitioners}
        />
      )}
      {screen === 'booking' && (
        <BookingScreen practitioner={practitioner} restored={restored} onBack={() => setScreen('results')} onConfirm={(s, d) => { setSlot(s); setAppointmentDate(d); setScreen('portal'); }} />
      )}
      {screen === 'portal' && (
        <PortalScreen practitioner={practitioner} onBack={() => setScreen('booking')} onDone={handleConfirmBooking} />
      )}
      {screen === 'confirmed' && (
        <ConfirmedScreen practitioner={practitioner} slot={slot} date={appointmentDate} onHome={goHome} />
      )}

      <Footer />
    </div>
  );
}
