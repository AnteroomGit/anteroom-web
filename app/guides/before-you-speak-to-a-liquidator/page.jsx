import GuideLayout from '../../components/GuideLayout';
import { pageMeta } from '../../../lib/meta';

export const metadata = pageMeta({
  title: 'Before you speak to a liquidator',
  description: 'A checklist of what to gather and what to ask before a first conversation with a registered liquidator about ATO debt, a DPN or a statutory demand.',
  path: '/guides/before-you-speak-to-a-liquidator',
});

const SOURCES = [
  {
    label: 'ASIC: Insolvency for directors (Information Sheet 42)',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors',
  },
  {
    label: 'ATO: Director penalties',
    href: 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/engaging-a-worker/in-detail/director-penalty-regime',
  },
  {
    label: 'ASIC: FAQs on small business restructuring',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors/faqs-small-business-restructuring',
  },
];

export default function Guide() {
  return (
    <GuideLayout
      slug="before-you-speak-to-a-liquidator"
      title="Before you speak to a liquidator"
      description="A checklist of what to gather and what to ask before a first conversation with a registered liquidator about ATO debt, a DPN or a statutory demand."
      lead="A first conversation goes further when you bring the right paperwork and a few questions. This is a checklist you can work through in an evening."
      sources={SOURCES}
    >
      <h2>What to gather</h2>
      <p>You will not have all of it, and that is fine. Bring what you can find.</p>
      <ul>
        <li>
          <strong>Every letter and notice from the ATO.</strong> A Director Penalty Notice, a
          statutory demand, a garnishee notice, payment plan letters. Note the date each one was
          issued or arrived. The dates matter more than anything else on this list.
        </li>
        <li>
          <strong>Your lodgement position.</strong> Which BAS and super statements are lodged, which
          are late, and which have not been done.
        </li>
        <li>
          <strong>What the company owes.</strong> The ATO, suppliers, lenders, the landlord, and
          employees (wages, super and leave). Rough amounts are fine.
        </li>
        <li>
          <strong>Bank statements and your accounting file,</strong> such as Xero or MYOB, if you
          have one.
        </li>
        <li>
          <strong>What the company owns.</strong> Equipment, vehicles, stock, and money customers owe it.
        </li>
        <li>
          <strong>Anything that involves you personally.</strong> Personal guarantees you have
          signed, and any loans between you and the company.
        </li>
        <li>
          <strong>Company details.</strong> ABN, ACN, the address on ASIC&apos;s register, and who
          the directors are.
        </li>
      </ul>

      <h2>Questions to ask</h2>
      <ul>
        <li>Are you a registered liquidator, and what is your ASIC registration number?</li>
        <li>Have you handled situations like mine, such as a Director Penalty Notice or a statutory demand?</li>
        <li>What are my options, and what does each one mean for me personally?</li>
        <li>Which deadline is closest, and what has to happen before it?</li>
        <li>What does the first stage cost, what is included, and when do I pay?</li>
        <li>What do you need from me, and by when?</li>
      </ul>

      <h2>In the meantime</h2>
      <p>
        ASIC says that if your company is insolvent, you should not allow it to take on more debt.
        If you are not sure whether it is, that is a good reason to make the call. Ask the
        liquidator what you should and should not do with company money until you have decided on
        a path.
      </p>

      <h2>Be open about the awkward parts</h2>
      <p>
        A liquidator looks at the whole of the company&apos;s affairs, including recent payments and
        any loans between you and the company. If something worries you, raise it in the first
        conversation. It is easier to deal with early than to have it come up later.
      </p>

      <h2>Where AnteRoom fits</h2>
      <p>
        The free check on this site asks a few short questions about your notice and your
        company, tells you where you stand, and, if it makes sense, sends your answers with a
        consultation request. You do not need an account to do the check.
      </p>
      <p>
        <a href="/guides/what-a-liquidator-does">What a registered liquidator does</a> explains the
        roles in more detail.
      </p>
    </GuideLayout>
  );
}
