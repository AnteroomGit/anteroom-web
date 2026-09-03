import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { renderToBuffer } from '@react-pdf/renderer';
import CaseSummaryPDF from '../../components/CaseSummaryPDF';

// Server-side only. Never exposed to the browser, unlike the Supabase
// publishable key. This must be added in Vercel as type "Secret", the
// opposite of how the Supabase keys were added.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { appointmentId, accessToken } = await request.json();
    if (!appointmentId || !accessToken) {
      return Response.json({ error: 'Missing appointmentId or accessToken' }, { status: 400 });
    }

    // Authenticate as the actual requesting user (not a service role), so
    // the database's own security rules decide whether they're allowed to
    // see this appointment, the same protection as every other query in
    // the app, not a special bypass for this route.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, clients(first_name, last_name), practitioners(name)')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return Response.json({ error: 'Appointment not found, or you don\u2019t have access to it' }, { status: 404 });
    }

    const clientName = appointment.clients
      ? `${appointment.clients.first_name || ''} ${appointment.clients.last_name || ''}`.trim() || 'Client'
      : 'Client';
    const practitionerName = appointment.practitioners?.name || 'Practitioner';

    // Ask Claude to write the prose summary, explicitly constrained to
    // stay factual, since this is meant to be background information for
    // a professional, not advice or a diagnosis in its own right.
    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are preparing a short, factual case summary for a registered insolvency, restructuring, accounting or legal professional, based on a company director's self-reported answers to a free triage questionnaire on AnteRoom.

Write a clear, professional summary in prose (150-250 words) covering: what brought the director to the tool, their reported financial position (debt scale, entitlements and lodgement status, assets, creditor situation, where available), and the computed pathway suggestion, if any.

Strict rules: do not add any new diagnosis, opinion, or recommendation beyond what's in the data provided. Do not state definitively that the company is insolvent. Do not tell the practitioner what to do. This is a factual summary of self-reported answers for background only, not advice, and not a substitute for the practitioner's own assessment.`,
      messages: [{
        role: 'user',
        content: `Client: ${clientName}\nNotice type: ${appointment.notice_type || 'none reported'}\nNotice date: ${appointment.notice_date || 'n/a'}\nComputed pathway: ${appointment.pathway || 'none computed'}\nAdditional notes from client: ${appointment.notes || 'none'}\nFull triage answers (raw): ${JSON.stringify(appointment.triage_answers)}`,
      }],
    });

    const aiSummary = aiResponse.content[0]?.text || 'Summary could not be generated.';

    const pdfBuffer = await renderToBuffer(
      <CaseSummaryPDF
        clientName={clientName}
        practitionerName={practitionerName}
        aiSummary={aiSummary}
        noticeType={appointment.notice_type}
        noticeDate={appointment.notice_date}
        notes={appointment.notes}
        pathway={appointment.pathway}
        answers={appointment.triage_answers}
        createdAt={appointment.created_at}
      />
    );

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="anteroom-summary-${appointmentId}.pdf"`,
      },
    });
  } catch (err) {
    console.error('generate-summary error:', err);
    return Response.json({ error: 'Something went wrong generating the summary' }, { status: 500 });
  }
}
