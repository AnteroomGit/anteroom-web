'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PractitionerAccountNav from '../../components/PractitionerAccountNav';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { supabase } from '../../../lib/supabase';
import { PractitionerCard } from '../../page';
import { SPECIALTIES } from '../../signup/practitioner/page';

export default function PractitionerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [tags, setTags] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPreference, setContactPreference] = useState('either');
  const [verified, setVerified] = useState(false);
  // Read-only, shown but never editable here -- see the file comments in
  // the SQL migration and tonight's build notes for why: these are
  // exactly what gets checked against ASIC before verified is set true,
  // so a self-service edit with no re-check would quietly undermine
  // what the verified badge is supposed to mean.
  const [practitionerType, setPractitionerType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
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
        setTags(profile.tags || []);
        setAvatarUrl(profile.avatar_url || '');
        setPhone(profile.phone || '');
        setContactPreference(profile.contact_preference || 'either');
        setVerified(!!profile.verified);
        setPractitionerType(profile.practitioner_type || '');
        setRegistrationNumber(profile.registration_number || '');
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function toggleTag(tag) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    const { error: saveError } = await supabase.from('practitioners').upsert(
      { id: user.id, name, firm, bio, suburb: address, lat, lng, tags, avatar_url: avatarUrl, phone, contact_preference: contactPreference },
      { onConflict: 'id' }
    );

    if (saveError) setError(saveError.message);
    else setSaved(true);
  }

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-account-layout">
          <PractitionerAccountNav active="profile" />
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Fed to the exact same PractitionerCard directors actually see, so
  // this preview can never quietly drift out of sync with reality --
  // it's the real component, not a second copy of it.
  const initials = (name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const previewPractitioner = {
    name: name || 'Your name', firm: firm || 'Your firm', title: practitionerType || 'Category not set',
    verified, suburb: address || 'Address not set', tags, next: 'This week',
    avatar_url: avatarUrl, initials, contact_preference: contactPreference,
  };

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <PractitionerAccountNav active="profile" />
        <div>
          <h2 style={{ marginTop: 0 }}>Your profile</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
            This is what directors see when your profile appears in search results.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
            <div className="ar-card">
              <p className="ar-tag" style={{ color: verified ? 'var(--sage)' : 'var(--amber)', marginBottom: '0.5rem', display: 'inline-block' }}>
                {verified ? 'Verified' : 'Awaiting verification'}
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                <div><strong>Category on file:</strong> {practitionerType || 'Not set'}</div>
                <div><strong>Registration number on file:</strong> {registrationNumber || 'Not set'}</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  Need to correct either of these? Get in touch via <a href="/contact" style={{ color: 'var(--brand)' }}>Contact</a> rather than editing directly, since both are checked against ASIC before verification.
                </div>
              </div>

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

                <label className="ar-label">Phone</label>
                <input className="ar-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: '1rem' }} placeholder="Needed if you'd rather directors call" />

                <label className="ar-label">If a director wants to reach out, you'd prefer...</label>
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {[
                    { value: 'email', label: 'Email' },
                    { value: 'call', label: 'A call' },
                    { value: 'either', label: 'Either is fine' },
                  ].map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, flex: 1, justifyContent: 'center', fontSize: '0.86rem', border: '1px solid var(--line)', borderRadius: 8, padding: '0.5rem', background: contactPreference === opt.value ? 'var(--brand-tint)' : 'transparent' }}>
                      <input type="radio" name="contactPreference" value={opt.value} checked={contactPreference === opt.value} onChange={() => setContactPreference(opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                </div>

                <label className="ar-label">Specialties</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  {SPECIALTIES.map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <input type="checkbox" checked={tags.includes(s)} onChange={() => toggleTag(s)} />
                      {s}
                    </label>
                  ))}
                </div>

                <label className="ar-label">Photo</label>
                <input
                  className="ar-input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Link to a photo you already host (LinkedIn, your firm's site, etc.)"
                  style={{ marginBottom: '0.35rem' }}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1.25rem' }}>
                  A real photo beats initials. Paste a direct image link for now; a proper upload is on the list for later.
                </p>

                {error && <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="ar-btn-primary">Save profile</button>
                {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Saved</span>}
              </form>
            </div>

            <div style={{ position: 'sticky', top: '1.5rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live preview
              </p>
              <PractitionerCard p={previewPractitioner} onBook={() => {}} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
