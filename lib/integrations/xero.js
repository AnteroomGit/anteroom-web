// Xero OAuth2 + Accounting API reports, scaffolded against Xero's
// documented endpoints (developer.xero.com). Needs XERO_CLIENT_ID and
// XERO_CLIENT_SECRET from a Xero app you register yourself at
// developer.xero.com/app/manage -- self-serve, no approval wait, typically
// live within minutes. Register the redirect URI there as exactly the
// value you put in XERO_REDIRECT_URI, e.g.
// https://anteroom.com.au/api/integrations/xero/callback

const XERO_AUTHORIZE_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';

// Granular scopes -- Xero deprecated the old single accounting.reports.read
// scope for apps created after March 2026, replaced with report-specific
// ones. These are exactly the reports this feature needs; nothing broader.
const XERO_SCOPES = [
  'openid', 'profile', 'email',
  'accounting.reports.profitandloss.read',
  'accounting.reports.balancesheet.read',
  'accounting.reports.aged.read',
  'accounting.reports.taxreports.read', // BAS/GST -- directly relevant to ATO debt
  'accounting.contacts.read',
  'offline_access', // required to receive a refresh_token, not just a short-lived access_token
].join(' ');

export function getXeroAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.XERO_CLIENT_ID,
    redirect_uri: process.env.XERO_REDIRECT_URI,
    scope: XERO_SCOPES,
    state,
  });
  return `${XERO_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeXeroCode(code) {
  const basicAuth = Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.XERO_REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(`Xero token exchange failed: ${await res.text()}`);
  return res.json(); // { access_token, refresh_token, expires_in, id_token, ... }
}

export async function refreshXeroToken(refreshToken) {
  const basicAuth = Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Xero token refresh failed: ${await res.text()}`);
  return res.json();
}

// A single Xero login can grant access to more than one organisation
// ("tenant"). This app only asks a client to connect one business, so we
// take the first tenant returned -- fine for a sole director connecting
// their own single company, not built for multi-entity groups yet.
export async function getXeroTenantId(accessToken) {
  const res = await fetch(XERO_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Could not list Xero connections: ${await res.text()}`);
  const connections = await res.json();
  return connections[0]?.tenantId || null;
}

async function xeroGet(path, accessToken, tenantId) {
  const res = await fetch(`${XERO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Xero API error on ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// Pulls exactly the reports relevant to an insolvency-triage read: P&L,
// Balance Sheet, and both aged reports (aged payables is usually the
// clearest single signal of real distress -- who's owed, and how overdue).
// Aged report calls are individually wrapped so one missing/unsupported
// report doesn't take down the whole fetch.
export async function fetchXeroReports(accessToken, tenantId) {
  const [profitAndLoss, balanceSheet, agedPayables, agedReceivables] = await Promise.all([
    xeroGet('/Reports/ProfitAndLoss', accessToken, tenantId).catch((e) => ({ error: e.message })),
    xeroGet('/Reports/BalanceSheet', accessToken, tenantId).catch((e) => ({ error: e.message })),
    xeroGet('/Reports/AgedPayablesByContact', accessToken, tenantId).catch((e) => ({ error: e.message })),
    xeroGet('/Reports/AgedReceivablesByContact', accessToken, tenantId).catch((e) => ({ error: e.message })),
  ]);
  return { provider: 'xero', profitAndLoss, balanceSheet, agedPayables, agedReceivables };
}
