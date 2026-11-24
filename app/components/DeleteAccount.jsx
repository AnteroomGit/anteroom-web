'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';
import { supabase } from '../../lib/supabase';

// The "Delete your account" card and its confirmation, shared by the client
// and practitioner security pages (which had two near-identical copies).
// Only the wording differs, so that comes in as props.
export default function DeleteAccount({ cardText, dialogText }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'We could not delete your account. Please try again, or contact us.');
      // The account is already gone at this point. signOut just clears the
      // now-invalid local session so nothing lingers in the browser.
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="ar-card" style={{ maxWidth: 480, borderColor: 'var(--clay)' }}>
        <p style={{ fontWeight: 300, margin: 0 }}>Delete your account</p>
        <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>{cardText}</p>
        <button
          type="button"
          className="ar-btn-ghost"
          style={{ color: 'var(--clay)', borderColor: 'var(--clay)', width: 'auto' }}
          onClick={() => setOpen(true)}
        >
          Delete my account
        </button>
      </div>

      <ConfirmDialog
        open={open}
        title="Delete your account?"
        confirmLabel={deleting ? 'Deleting...' : 'Yes, delete it'}
        cancelLabel="Keep my account"
        danger
        busy={deleting}
        error={error}
        onConfirm={handleDelete}
        onCancel={() => { setOpen(false); setError(null); }}
      >
        {dialogText}
      </ConfirmDialog>
    </>
  );
}
