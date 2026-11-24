import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { pageMeta } from '../../lib/meta';
import { ABN, CONTACT_EMAIL, CONTACT_PHONE } from '../../lib/site';

export const metadata = pageMeta({
  title: 'Why AnteRoom exists',
  description: 'Why AnteRoom was built: a free, plain-English first stop for company directors who have received an ATO notice, before they need to call a professional.',
  path: '/about',
});

// A photo of the founder shows up here on its own once a file called
// founder.jpg is put in public/images. Without the file the page simply has no
// photo, so nothing is broken or faked in the meantime. This runs when the
// site is built, not for each visitor.
function hasFounderPhoto() {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', 'images', 'founder.jpg'));
  } catch {
    return false;
  }
}

export default function About() {
  const photo = hasFounderPhoto();

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Why AnteRoom exists</h1>
        <p>
          I work part time at an Australian insolvency advisory firm. Most days that means
          statutory reports, creditor letters, and reading the same few notices over and over: a
          Director Penalty Notice, a garnishee notice, a statutory demand.
        </p>
        <p>
          I kept seeing the same thing. A director would work out what a notice meant only after
          the deadline that could have protected them had passed. Sometimes the choices had
          already narrowed, for example because a lodgement was months late.
        </p>
        <p>
          There are plenty of good advisors. What was missing was somewhere free to go first. The
          usual way in is to ring a professional, and that assumes you already know you are in
          trouble and feel ready to make the call. A lot of directors do not get there in time.
        </p>

        <h2>What AnteRoom is</h2>
        <p>
          A free first stop. You answer a few short questions and AnteRoom tells you plainly what
          your situation means and how urgent it is. If it makes sense to talk to someone, you can
          ask a verified registered liquidator for a consultation. Your answers go with the
          request, so the first conversation does not start from zero.
        </p>

        <h2>What it is not</h2>
        <p>
          AnteRoom is not a law firm, an accountant or a liquidator, and it does not give legal
          or financial advice. What you see is general information. For advice on your own
          situation, talk to a registered liquidator, an accountant or a lawyer.
        </p>

        <h2>How it is paid for</h2>
        <p>
          Directors never pay. Registered liquidators pay a flat membership fee to be listed. The
          fee does not depend on how many directors they meet or what work follows, and it cannot
          buy a higher spot in the list. The details are on <a href="/how-we-work">How We Work</a>,
          and there are plain-English explainers in the <a href="/guides">guides</a>.
        </p>

        <div className="ar-founder">
          {photo && (
            <Image
              className="ar-founder-photo"
              src="/images/founder.jpg"
              alt="Jack James, founder of AnteRoom"
              width={160}
              height={160}
            />
          )}
          <div>
            <p className="ar-founder-name">Jack James, founder</p>
            <p>
              The firm I work for is not part of AnteRoom and never will be. It is permanently
              excluded from the network.
            </p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              {CONTACT_PHONE ? <> &middot; {CONTACT_PHONE}</> : null}
            </p>
            <p className="muted">AnteRoom &middot; ABN {ABN}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
