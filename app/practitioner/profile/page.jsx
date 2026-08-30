'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PractitionerProfile() {
  const [bio, setBio] = useState('');
  const [suburb, setSuburb] = useState('');
  const [tags, setTags] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-section" style={{ maxWidth: 480 }}>
        <h2>Your profile</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem' }}>
          This is what directors see when your profile appears in search results.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true); }}>
          <label className="ar-label">Short bio</label>
          <textarea className="ar-textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Suburb</label>
          <input className="ar-input" value={suburb} onChange={(e) => setSuburb(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Specialty tags (comma separated)</label>
          <input className="ar-input" value={tags} onChange={(e) => setTags(e.target.value)} style={{ marginBottom: '1.25rem' }} placeholder="Construction, SBR appointments" />

          <button type="submit" className="ar-btn-primary">Save profile</button>
          {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Saved</span>}
        </form>
      </div>
      <Footer />
    </div>
  );
}
