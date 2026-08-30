'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FAQS = [
  { q: 'Is Anteroom free to use?', a: 'Yes. The triage questions and searching for a practitioner are completely free. There is never a cost to you for using Anteroom.' },
  { q: 'Is my information shared with anyone?', a: 'Only with a specific practitioner you choose to book with, and only after you’ve separately agreed to that at the point of booking. Nothing is shared before then.' },
  { q: 'What if I’m not sure what notice I received?', a: 'That’s completely normal — select "Not sure" in the questions and we’ll treat it as urgent, since some notices carry very short deadlines.' },
  { q: 'Is this legal or financial advice?', a: 'No. Anteroom gives general information only. For advice about your specific situation, speak with the practitioner you book with.' },
  { q: 'How do I know a practitioner is genuinely registered?', a: 'Every practitioner’s registration is verified before their profile goes live, and this is shown with a verified badge on their card.' },
];

export default function Help() {
  const [open, setOpen] = useState(null);
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Help</h1>
        {FAQS.map((f, i) => (
          <div key={i} className="ar-faq-item" onClick={() => setOpen(open === i ? null : i)}>
            <h3>{f.q} {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</h3>
            {open === i && <p>{f.a}</p>}
          </div>
        ))}
        <h2>Worried about a scam?</h2>
        <p>
          Anteroom will never ask you to pay to speak with a practitioner, and we&apos;ll never ask
          for payment details, passwords, or bank information directly. If you receive a message
          claiming to be from Anteroom asking for either, treat it as suspicious and contact us
          directly through our <a href="/contact">Contact page</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
