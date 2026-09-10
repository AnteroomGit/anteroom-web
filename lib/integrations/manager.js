// Manager.io does NOT use OAuth, and has no central developer-app
// registration at all -- a real, documented difference from Xero and
// MYOB, not an oversight here. Each business generates its own API key
// from inside their own Manager.io account settings, and the API is
// reached at https://<their-subdomain>.manager.io/api using that key.
// This module takes the subdomain + key the client pastes in directly,
// via a small form, rather than a "Connect" OAuth popup like the other two.
//
// Worth knowing before relying on this in production: Manager.io's API
// has no official, versioned documentation and no dedicated report
// endpoints (no clean "Profit and Loss" or "Balance Sheet" call like
// Xero/MYOB) -- it exposes raw ledger-style data (accounts, transactions)
// that this app has to summarise itself, rather than receiving an
// already-computed report. That makes Manager.io connections meaningfully
// rougher than the other two providers. The exact header name below
// (X-API-KEY) and endpoint shape should be confirmed against a real trial
// account's live /api response before this is relied on -- the community
// forum is explicit that there's no solid published spec to build against
// blind.

export async function testManagerConnection(subdomain, apiKey) {
  const res = await fetch(`https://${subdomain}.manager.io/api`, {
    headers: { 'X-API-KEY': apiKey },
  });
  if (!res.ok) throw new Error(`Could not reach Manager.io business: ${res.status}`);
  return res.json();
}

export async function fetchManagerAccounts(subdomain, apiKey) {
  const res = await fetch(`https://${subdomain}.manager.io/api/accounts`, {
    headers: { 'X-API-KEY': apiKey },
  });
  if (!res.ok) throw new Error(`Manager.io API error: ${res.status}`);
  return res.json();
}
