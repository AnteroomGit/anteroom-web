import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { fetchXeroReports, refreshXeroToken } from '../../../../lib/integrations/xero';
import { fetchMyobReports } from '../../../../lib/integrations/myob';
import { fetchManagerAccounts } from '../../../../lib/integrations/manager';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// financial_connections has no practitioner-facing RLS policy -- on
// purpose, since a practitioner should never be able to query it directly
// (raw tokens/API keys are stored there). This route reads it with the
// service role specifically so it alone can bridge from "appointment I'm
// genuinely on" to "that client's stored connection", and only ever
// returns the generated report *text* back out, never the credentials
// themselves. Same narrow exception as the OAuth callback routes.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { appointmentId, accessToken } = await request.json();
    if (!appointmentId || !accessToken) {
      return Response.json({ error: 'Missing appointmentId or accessToken' }, { status: 400 });
    }

    // Confirm the requesting practitioner is genuinely on this
    // appointment, using their own session so RLS enforces it -- done
    // first and separately from the admin client below, so a
    // practitioner can never trigger this for an appointment they're
    // not actually part of, exactly like generate-summary.js.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, clients(first_name, last_name)')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return Response.json({ error: 'Appointment not found, or you don\u2019t have access to it' }, { status: 404 });
    }

    const { data: connections } = await supabaseAdmin
      .from('financial_connections')
      .select('*')
      .eq('client_id', appointment.client_id);

    if (!connections || connections.length === 0) {
      return Response.json({ error: 'This client hasn\u2019t connected accounting software yet.' }, { status: 404 });
    }

    // Only the first connected provider is used for now -- if a client
    // somehow connected more than one, this takes whichever comes back
    // first rather than merging multiple sources. A reasonable v1
    // limitation given most directors have one real set of books.
    const connection = connections[0];
    let financialData;

    if (connection.provider === 'xero') {
      let accessTok = connection.access_token;
      // Xero access tokens are short-lived (~30 min) -- refresh first
      // rather than hoping the stored one still works.
      try {
        const refreshed = await refreshXeroToken(connection.refresh_token);
        accessTok = refreshed.access_token;
        await supabaseAdmin
          .from('financial_connections')
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq('id', connection.id);
      } catch (refreshErr) {
        console.error('Xero refresh failed, trying stored token as-is:', refreshErr);
      }
      financialData = await fetchXeroReports(accessTok, connection.tenant_id);
    } else if (connection.provider === 'myob') {
      financialData = await fetchMyobReports(connection.access_token, connection.tenant_id);
    } else if (connection.provider === 'manager') {
      financialData = { provider: 'manager', accounts: await fetchManagerAccounts(connection.subdomain, connection.api_key) };
    } else {
      return Response.json({ error: 'Unrecognised accounting provider' }, { status: 400 });
    }

    const clientName = appointment.clients
      ? `${appointment.clients.first_name || ''} ${appointment.clients.last_name || ''}`.trim() || 'Client'
      : 'Client';

    // Ask Claude to write the briefing, explicitly constrained the same
    // way generate-summary.js constrains its own prompt -- factual only,
    // no diagnosis, no pathway recommendation. That judgement stays with
    // the practitioner; this is background reading, not a substitute for
    // their own review of the full books.
    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `You are preparing a factual financial briefing for a registered insolvency practitioner (liquidator), to read before or during their first meeting with a company director. The data comes directly from the director's own connected accounting software (${financialData.provider}) via API, not from anything the director typed themselves.

Write a clear, structured briefing covering, where the data supports it:
- Overall financial position: revenue trend, profitability, and cash position from the P&L and balance sheet
- Liabilities picture: what's owed and to whom, with particular attention to any tax-related and superannuation-related payables visible in the data, since this tool exists for ATO-debt-related triage
- Aged payables: how much is overdue, and how overdue, since aging is often the clearest signal of real distress
- Any other patterns in the data a liquidator would want to see early (e.g. declining revenue alongside growing payables, related-party balances, director loan accounts if visible)

Strict rules: report only what the data actually shows. Do not diagnose insolvency, recommend a pathway (SBR/VA/liquidation/etc), or draw legal conclusions -- that judgement belongs to the practitioner. If a report section wasn't retrievable or is empty, say so plainly rather than guessing. This is background material, not advice, and not a substitute for the practitioner's own review of the full books.`,
      messages: [{
        role: 'user',
        content: `Client: ${clientName}\nConnected via: ${financialData.provider}\nRaw data:\n${JSON.stringify(financialData, null, 2).slice(0, 30000)}`,
      }],
    });

    const reportText = aiResponse.content[0]?.text || 'Report could not be generated.';

    await supabaseAdmin
      .from('appointments')
      .update({
        financial_report: { text: reportText, provider: financialData.provider },
        financial_report_generated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    return Response.json({ report: reportText, provider: financialData.provider });
  } catch (err) {
    console.error('generate-report error:', err);
    return Response.json({ error: err.message || 'Something went wrong generating the financial report' }, { status: 500 });
  }
}
