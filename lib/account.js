import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// One shared answer to "who is signed in?" for the header and footer.
//
// Before this, each of them asked Supabase on every page and again on every
// sign-in event, so the nav flickered and the database was queried two or
// three times per click. Now it is asked once, remembered for the life of
// the tab, and refreshed only when the person actually changes.
//
//   undefined   not known yet
//   null        nobody signed in (or the login has no profile row)
//   object      { name, href, type }, where type is 'client' or 'practitioner'
//
// Anything that changes the name shown in the nav (saving a profile, say)
// should call refreshAccount().

let cached;
let cachedUserId = null;
let inflight = null;
let dirty = false;
let subscribed = false;
const listeners = new Set();

function publish(next) {
  cached = next;
  listeners.forEach((fn) => fn(next));
}

async function lookup() {
  // getSession reads the saved login on this device, so a logged-out visitor
  // costs no network request at all.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    cachedUserId = null;
    return null;
  }
  cachedUserId = user.id;

  // A client and a practitioner never share an id, so at most one of these
  // finds a row.
  const [{ data: client }, { data: practitioner }] = await Promise.all([
    supabase.from('clients').select('first_name').eq('id', user.id).maybeSingle(),
    supabase.from('practitioners').select('name').eq('id', user.id).maybeSingle(),
  ]);

  if (client) {
    return { name: client.first_name || 'Account', href: '/account/profile', type: 'client' };
  }
  if (practitioner) {
    return { name: practitioner.name || 'Account', href: '/practitioner/dashboard', type: 'practitioner' };
  }
  return null;
}

export function refreshAccount() {
  if (inflight) {
    // Something changed while a lookup was running, so run it once more
    // afterwards rather than trusting a possibly stale answer.
    dirty = true;
    return inflight;
  }
  inflight = lookup()
    .then((value) => publish(value))
    .catch((err) => {
      console.error('Account lookup failed:', err);
      if (cached === undefined) publish(null);
    })
    .finally(() => {
      inflight = null;
      if (dirty) {
        dirty = false;
        refreshAccount();
      }
    });
  return inflight;
}

function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  supabase.auth.onAuthStateChange((event, session) => {
    // Supabase asks callbacks not to call back into the client while it is
    // still dispatching an event, so the work waits for the next tick.
    setTimeout(() => {
      if (event === 'SIGNED_OUT') {
        cachedUserId = null;
        publish(null);
        return;
      }
      // These do not change who is signed in.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
      const id = session?.user?.id || null;
      if (id && id === cachedUserId && cached !== undefined) return;
      refreshAccount();
    }, 0);
  });
}

export function useAccount() {
  const [value, setValue] = useState(cached);

  useEffect(() => {
    listeners.add(setValue);
    ensureSubscribed();
    if (cached === undefined) refreshAccount();
    else setValue(cached);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return value;
}
