'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';
import { getQuestionText, getAnswerLabel } from '../../../lib/triageQuestions';

export default function Answers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Same dual-source pattern as the profile page's "last result" --
      // prefer the always-current triage_sessions snapshot, fall back to
      // a past booking's answers for anyone who booked before that table
      // existed.
      const [{ data: session }, { data: appointments }] = await Promise.all([
        supabase.from('triage_sessions').select('answers').eq('client_id', user.id).maybeSingle(),
        supabase.from('appointments').select('triage_answers').eq('client_id', user.id)
          .order('created_at', { ascending: false }).limit(1),
      ]);

      const source = (session?.answers && Object.keys(session.answers).length > 0)
        ? session.answers
        : appointments?.[0]?.triage_answers;

      setAnswers(source || null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-account-layout">
          <AccountNav active="answers" />
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const entries = answers ? Object.entries(answers).filter(([, v]) => v !== null && v !== undefined && v !== '') : [];

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="answers" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Your answers</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
            Exactly what you told us, question by question.
          </p>

          {entries.length === 0 ? (
            <div className="ar-card">
              <p style={{ margin: 0 }}>You haven't completed the check yet.</p>
              <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
                <a href="/?start=1" style={{ color: 'var(--brand)' }}>Answer the questions</a> to see them here afterward.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {entries.map(([key, value]) => (
                <div key={key} className="ar-card">
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>
                    {getQuestionText(key)}
                  </div>
                  <div style={{ fontWeight: 300 }}>{getAnswerLabel(key, value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
