// MYOB Business API OAuth2 + reporting, scaffolded against MYOB's
// documented endpoints (developer.myob.com). Needs MYOB_CLIENT_ID and
// MYOB_CLIENT_SECRET from an app registered at my.myob.com.
//
// Real difference from Xero worth knowing before you plan a timeline
// around this: MYOB requires manual approval into their Developer
// Program before you can even register an app -- it's not same-day
// self-serve like Xero. Budget real lead time for this one.
//
// Register the redirect URI there as exactly the value you put in
// MYOB_REDIRECT_URI, e.g. https://anteroom.com.au/api/integrations/myob/callback

const MYOB_AUTHORIZE_URL = 'https://secure.myob.com/oauth2/account/authorize';
const MYOB_TOKEN_URL = 'https://secure.myob.com/oauth2/v1/authorize';
const MYOB_API_BASE = 'https://api.myob.com/accountright';

// MYOB has moved toward granular, named scopes (legacy CompanyFile-wide
// access is deprecated for new apps). Check
// developer.myob.com/api/myob-business-api/api-overview/scopes/ at setup
// time and replace this with whichever named scopes actually cover P&L,
// Balance Sheet and Aged reports for your approved app -- left as a
// clearly-flagged placeholder rather than guessed at.
const MYOB_SCOPES = 'CompanyFile';

export function getMyobAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.MYOB_CLIENT_ID,
    redirect_uri: process.env.MYOB_REDIRECT_URI,
    response_type: 'code',
    scope: MYOB_SCOPES,
    state,
  });
  return `${MYOB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeMyobCode(code) {
  const res = await fetch(MYOB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-myobapi-key': process.env.MYOB_CLIENT_ID,
      'x-myobapi-version': 'v2',
    },
    body: new URLSearchParams({
      client_id: process.env.MYOB_CLIENT_ID,
      client_secret: process.env.MYOB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.MYOB_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`MYOB token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshMyobToken(refreshToken) {
  const res = await fetch(MYOB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-myobapi-key': process.env.MYOB_CLIENT_ID,
      'x-myobapi-version': 'v2',
    },
    body: new URLSearchParams({
      client_id: process.env.MYOB_CLIENT_ID,
      client_secret: process.env.MYOB_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`MYOB token refresh failed: ${await res.text()}`);
  return res.json();
}

// MYOB requires picking a specific company file after login -- a
// business may have more than one, so this takes the first returned,
// matching the same single-company assumption as the Xero module.
export async function getMyobCompanyFile(accessToken) {
  const res = await fetch(MYOB_API_BASE, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-myobapi-key': process.env.MYOB_CLIENT_ID,
      'x-myobapi-version': 'v2',
    },
  });
  if (!res.ok) throw new Error(`Could not list MYOB company files: ${await res.text()}`);
  const files = await res.json();
  return files[0] || null; // { Id, Name, Uri, ... }
}

async function myobGet(uri, accessToken) {
  const res = await fetch(uri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-myobapi-key': process.env.MYOB_CLIENT_ID,
      'x-myobapi-version': 'v2',
    },
  });
  if (!res.ok) throw new Error(`MYOB API error: ${res.status} ${await res.text()}`);
  return res.json();
}

// companyFileUri is the Uri returned by getMyobCompanyFile() above, stored
// as this connection's tenant_id. Confirm the exact report path segments
// against the live Swagger/API browser for your approved scopes before
// relying on this in production -- MYOB's reporting endpoints are less
// uniformly documented than Xero's.
export async function fetchMyobReports(accessToken, companyFileUri) {
  const [profitAndLoss, balanceSheet] = await Promise.all([
    myobGet(`${companyFileUri}/Reports/ProfitAndLoss`, accessToken).catch((e) => ({ error: e.message })),
    myobGet(`${companyFileUri}/Reports/BalanceSheet`, accessToken).catch((e) => ({ error: e.message })),
  ]);
  return { provider: 'myob', profitAndLoss, balanceSheet };
}
