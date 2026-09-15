'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { supabase } from '../../../lib/supabase';

export default function PractitionerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [tags, setTags] = useState('');
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase.from('practitioners').select('*').eq('id', user.id).maybeSingle();
      if (profile) {
        setName(profile.name || '');
        setFirm(profile.firm || '');
        setBio(profile.bio || '');
        setAddress(profile.suburb || '');
        setLat(profile.lat || null);
        setLng(profile.lng || null);
        setTags((profile.tags || []).join(', '));
        setVerified(!!profile.verified);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    // upsert, same reasoning as the client profile fix earlier -- a
    // plain update() would silently do nothing for any account whose row
    // wasn't created cleanly, for whatever reason, at signup time.
    const { error: saveError } = await supabase.from('practitioners').upsert(
      {
        id: user.id,
        name,
        firm,
        bio,
        suburb: address,
        lat,
        lng,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      },
      { onConflict: 'id' }
    );

    if (saveError) setError(saveError.message);
    else setSaved(true);
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
      <div className="ar-section" style={{ maxWidth: 480 }}>
        <h2 style={{ marginBottom: 0 }}>Your profile</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
          This is what directors see when your profile appears in search results.
        </p>

        <p className="ar-tag" style={{ color: verified ? 'var(--sage)' : 'var(--ink-soft)', marginBottom: '1.25rem', display: 'inline-block' }}>
          {verified ? 'Verified' : 'Awaiting verification'}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="ar-label">Name</label>
          <input className="ar-input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Firm</label>
          <input className="ar-input" value={firm} onChange={(e) => setFirm(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Short bio</label>
          <textarea className="ar-textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Firm address</label>
          <AddressAutocomplete
            value={address}
            onChange={({ address: a, lat: newLat, lng: newLng }) => { setAddress(a); if (newLat) setLat(newLat); if (newLng) setLng(newLng); }}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0.35rem 0 1rem' }}>
            Moved firms? Just search and select the new address here. It updates the moment you save.
          </p>

          <label className="ar-label">Specialty tags (comma separated)</label>
          <input className="ar-input" value={tags} onChange={(e) => setTags(e.target.value)} style={{ marginBottom: '1.25rem' }} placeholder="Construction, SBR appointments" />

          {error && <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="ar-btn-primary">Save profile</button>
          {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Saved</span>}
        </form>
      </div>
      <Footer />
    </div>
  );
}
