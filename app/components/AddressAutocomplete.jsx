'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// Free and keyless -- no developer account or API key needed, unlike
// every genuinely Australian G-NAF-grade option (Addressify, AddressFinder,
// SmartAddress, DingoFind), which all require their own paid signup, the
// same pattern as Turnstile/Supabase/Xero already were tonight. Trade-off:
// this isn't G-NAF-precise, so an exact unit number won't always resolve
// perfectly -- worth upgrading to a paid provider later if that precision
// starts to matter, not something to silently pretend isn't a trade-off.
//
// Nominatim's usage policy asks for a real User-Agent/Referer identifying
// the app and a light touch (roughly one request/second) -- the debounce
// below keeps this well within that even on a fast typist.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function AddressAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInput(text) {
    setQuery(text);
    onChange?.({ address: text, lat: null, lng: null });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 4) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: text,
          format: 'jsonv2',
          countrycodes: 'au',
          addressdetails: '1',
          limit: '5',
        });
        const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
          headers: { 'Accept-Language': 'en-AU' },
        });
        const data = await res.json();
        setResults(data || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(result) {
    setQuery(result.display_name);
    setOpen(false);
    onChange?.({ address: result.display_name, lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        className="ar-input"
        value={query}
        placeholder={placeholder || 'Start typing your firm\u2019s address...'}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && (results.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
          marginTop: '0.3rem', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {loading && (
            <div style={{ padding: '0.6rem 0.8rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Searching...</div>
          )}
          {results.map((r) => (
            <div
              key={r.place_id}
              onClick={() => handleSelect(r)}
              style={{
                padding: '0.6rem 0.8rem', fontSize: '0.84rem', cursor: 'pointer',
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                borderBottom: '1px solid var(--line)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-tint)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <MapPin size={17} style={{ marginTop: '0.15rem', flexShrink: 0, color: 'var(--brand)' }} />
              <span>{r.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
