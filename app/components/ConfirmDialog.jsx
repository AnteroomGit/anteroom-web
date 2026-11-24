'use client';

import { useEffect, useId, useRef } from 'react';

// One accessible confirmation dialog, used for "Leave this page?" and
// "Delete your account?". It is announced as an alert dialog, labelled by
// its title and description, moves focus to the safe button when it opens,
// keeps Tab inside itself, closes on Escape, and puts focus back on
// whatever opened it. The page behind it does not scroll while it is open.
//
// While `busy` is true (a request is running) Escape and clicking outside
// do nothing, so a half-finished action cannot be dismissed by accident.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  danger = false,
  error = null,
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  // The effect below only re-runs when `open` changes, so it reads the
  // latest callbacks and busy flag from refs instead of closing over them.
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);
  onCancelRef.current = onCancel;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return undefined;

    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (cancelRef.current) cancelRef.current.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        if (!busyRef.current && onCancelRef.current) {
          event.stopPropagation();
          onCancelRef.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = dialog.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ar-modal-overlay" onClick={() => { if (!busy && onCancel) onCancel(); }}>
      <div
        ref={dialogRef}
        className="ar-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <p id={titleId} className="ar-modal-title">{title}</p>
        <div id={descId} className="ar-modal-text">{children}</div>
        {error && <p role="alert" className="ar-error-text ar-modal-error">{error}</p>}
        <div className="ar-modal-actions">
          <button ref={cancelRef} type="button" className="ar-btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ar-btn-primary${danger ? ' ar-btn-danger' : ''}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
