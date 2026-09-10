'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Link2, Unlink } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';

const PROVIDERS = [
  { id: 'xero', name: 'Xero', blurb: 'Connects with one click, and disconnects the same way.' },
  { id: 'myob', name: 'MYOB', blurb: 'Connects with one click, and disconnects the same way.' },
  { id: 'manager', name: 'Manager.io', blurb: 'Paste in your business subdomain and an API key generated from inside your own Manager.io account (Settings \u2192 API keys).' },
];

export default function Integrations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [connections, setConnections] = useState({});
  const [notice, setNotice] = useState(null);
  const [managerSubdomain, setManagerSubdomain] = useState('');
  const [managerKey, setManagerKey] = useState('');
  const [managerBusy, setManagerBusy] = useState(false);
  const [managerError, setManagerError] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Read straight from the URL rather than next/navigation's
      // useSearchParams(), which requires wrapping this whole page in a
      // Suspense boundary to avoid a build error -- unnecessary
      // complexity for reading two query params once on mount, and this
      // only ever runs client-side anyway.
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const error = params.get('error');
      if (connected) setNotice({ type: 'success', text: `${connected === 'xero' ? 'Xero' : connected === 'myob' ? 'MYOB' : 'Manager.io'} connected.` });
      if (error) setNotice({ type: 'error', text: `Connection failed (${error}). Try again, or reach out if it keeps happening.` });

      await refreshConnections();
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function refreshConnections() {
    const { data } = await supabase.from('financial_connections').select('provider, org_name, created_at');
    const byProvider = {};
    (data || []).forEach((c) => { byProvider[c.provider] = c; });
    setConnections(byProvider);
  }

  async function handleManagerConnect(e) {
    e.preventDefault();
    setManagerBusy(true);
    setManagerError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/integrations/manager/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: managerSubdomain, apiKey: managerKey, accessToken: session?.access_token }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not connect');
      setManagerSubdomain('');
      setManagerKey('');
      await refreshConnections();
      setNotice({ type: 'success', text: 'Manager.io connected.' });
    } catch (err) {
      setManagerError(err.message);
    } finally {
      setManagerBusy(false);
    }
  }

  async function handleDisconnect(provider) {
    setDisconnecting(provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, accessToken: session?.access_token }),
      });
      await refreshConnections();
    } finally {
      setDisconnecting(null);
    }
  }

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-section"><p style={{ color: 'var(--ink-soft)' }}>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="integrations" />
        <div>
          <h2 style={{ marginTop: 0 }}>Accounting software</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
            Connect your books so your practitioner has a clear financial picture before your first meeting, rather than starting from scratch. This is entirely optional, and only ever shared with a practitioner you actually book an appointment with.
          </p>

          {notice && (
            <p style={{
              fontSize: '0.86rem', marginBottom: '1.25rem',
              color: notice.type === 'success' ? 'var(--sage)' : 'var(--clay)',
            }}>
              {notice.text}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {PROVIDERS.map((p) => {
              const conn = connections[p.id];
              return (
                <div key={p.id} className="ar-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {p.name}
                        {conn && (
                          <span className="ar-tag" style={{ color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={11} /> Connected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        {conn ? `Connected as ${conn.org_name || p.name}` : p.blurb}
                      </div>
                    </div>

                    {conn ? (
                      <button
                        className="ar-btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
                        onClick={() => handleDisconnect(p.id)}
                        disabled={disconnecting === p.id}
                      >
                        <Unlink size={14} /> {disconnecting === p.id ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : p.id === 'manager' ? null : (
                      <a
                        href={`/api/integrations/${p.id}/connect?client_id=${userId}`}
                        className="ar-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto', textDecoration: 'none' }}
                      >
                        <Link2 size={14} /> Connect
                      </a>
                    )}
                  </div>

                  {p.id === 'manager' && !conn && (
                    <form onSubmit={handleManagerConnect} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div>
                        <label className="ar-label">Your Manager.io subdomain</label>
                        <input
                          className="ar-input" placeholder="e.g. northwind"
                          value={managerSubdomain} onChange={(e) => setManagerSubdomain(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="ar-label">API key</label>
                        <input
                          className="ar-input" type="password" placeholder="Generated from Settings \u2192 API keys in Manager.io"
                          value={managerKey} onChange={(e) => setManagerKey(e.target.value)}
                        />
                      </div>
                      {managerError && <p style={{ color: 'var(--clay)', fontSize: '0.82rem', margin: 0 }}>{managerError}</p>}
                      <button className="ar-btn-primary" style={{ width: 'auto', alignSelf: 'flex-start' }} disabled={managerBusy || !managerSubdomain || !managerKey}>
                        {managerBusy ? 'Connecting...' : 'Connect Manager.io'}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
