// "Does this browser look signed in?", answered without asking the network.
//
// The homepage is built on the server so that every visitor, and every
// search engine, gets the real page in the first response. Someone who is
// probably signed in should not see that page flash up before they are sent
// on to their dashboard, so two things use the answer from here:
//
//   * PRE_PAINT_SCRIPT runs in layout.jsx before the first paint. If the
//     browser looks signed in, it hides the homepage (a class on <html>)
//     until the account check has finished, with a safety timeout so a
//     failed check can never leave the page invisible.
//   * readSessionHint is the same test for the page's own code, which covers
//     later visits to the homepage inside the app, where the script does not
//     run again.
//
// Supabase keeps a signed-in session in local storage under a key shaped
// like sb-<project>-auth-token. Middleware cannot see local storage, which
// is why this is done in the browser. If you change the storage key, the
// pending-booking key or the timeout, change them here and nowhere else.

export const PENDING_BOOKING_KEY = 'anteroom_pending_booking';
export const PENDING_CLASS = 'ar-session-pending';
export const PENDING_TIMEOUT_MS = 4000;

const SESSION_KEY = /^sb-.+-auth-token$/;

export function readSessionHint() {
  try {
    if (localStorage.getItem(PENDING_BOOKING_KEY)) return true;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && SESSION_KEY.test(key)) return true;
    }
    return new URLSearchParams(window.location.search).get('start') === '1';
  } catch {
    // Storage blocked or unavailable: treat the visitor as signed out.
    return false;
  }
}

// The same test as a self-contained script. It only acts on the homepage.
// Written with plain var and function so any browser runs it, and wrapped in
// try/catch so it can never break the page.
export const PRE_PAINT_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
var hint=false;
try{
if(localStorage.getItem(${JSON.stringify(PENDING_BOOKING_KEY)}))hint=true;
else{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&/^sb-.+-auth-token$/.test(k)){hint=true;break;}}}
}catch(e){}
if(!hint&&/(^|[?&])start=1(&|$)/.test(location.search))hint=true;
if(!hint)return;
var root=document.documentElement;
root.classList.add(${JSON.stringify(PENDING_CLASS)});
setTimeout(function(){root.classList.remove(${JSON.stringify(PENDING_CLASS)});},${PENDING_TIMEOUT_MS});
}catch(e){}})();`;
