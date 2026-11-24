import GuideLayout from '../../components/GuideLayout';
import { pageMeta } from '../../../lib/meta';

export const metadata = pageMeta({
  title: 'What a registered liquidator does',
  description: 'What a registered liquidator does, how ASIC regulates them, what changes for directors once one is appointed, and how to check one before you call.',
  path: '/guides/what-a-liquidator-does',
});

const SOURCES = [
  {
    label: 'ASIC: Insolvency for directors (Information Sheet 42)',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors',
  },
  {
    label: 'ASIC: Your ongoing obligations and compliance as a registered liquidator',
    href: 'https://www.asic.gov.au/for-finance-professionals/registered-liquidators/your-ongoing-obligations-and-compliance-as-a-registered-liquidator',
  },
  {
    label: 'ASIC: FAQs on small business restructuring',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors/faqs-small-business-restructuring',
  },
  {
    label: 'ASIC: Liquidation, a guide for creditors (Information Sheet 45)',
    href: 'https://asic.gov.au/regulatory-resources/insolvency/insolvency-for-creditors/liquidation-a-guide-for-creditors/',
  },
];

export default function Guide() {
  return (
    <GuideLayout
      slug="what-a-liquidator-does"
      title="What a registered liquidator does"
      description="What a registered liquidator does, how ASIC regulates them, what changes for directors once one is appointed, and how to check one before you call."
      lead="A registered liquidator is an insolvency professional registered and supervised by ASIC. They run the formal insolvency processes, and they can also talk through your options before anything formal happens."
      sources={SOURCES}
    >
      <h2>Who they are</h2>
      <p>
        Registered liquidators have to be registered with ASIC, stay a fit and proper person, and
        hold professional indemnity and fidelity insurance. ASIC keeps a public register, so you can
        look one up by name before you call. It is on the{' '}
        <a
          href="https://connectonline.asic.gov.au/RegistrySearch/faces/landing/ProfessionalRegisters.jspx"
          rel="noopener noreferrer"
          target="_blank"
        >
          ASIC professional registers
        </a>{' '}
        page.
      </p>

      <h2>What they can do before anything formal</h2>
      <p>
        A first conversation is usually about options. They look at whether the company can pay its
        debts as they fall due, what each path would mean for you, and which deadlines are closest.
        ASIC suggests talking to a registered liquidator, an insolvency accountant or lawyer, or a
        financial advice service as soon as you suspect the company cannot pay its debts.
      </p>

      <h2>The formal roles</h2>
      <ul>
        <li>
          <strong>Liquidator.</strong> Takes control of the company so its affairs can be wound up
          in an orderly and fair way for the benefit of creditors.
        </li>
        <li>
          <strong>Voluntary administrator.</strong> Takes control for a short time to try to save
          the company or its business. It can end in a deed of company arrangement, or in
          liquidation.
        </li>
        <li>
          <strong>Small business restructuring practitioner.</strong> Helps an eligible small
          company put a restructuring plan to its creditors while the directors stay in control.
          Only a registered liquidator can be appointed to this role.{' '}
          <a href="/guides/small-business-restructuring">Who can use it</a>.
        </li>
      </ul>

      <h2>What changes for you once one is appointed</h2>
      <p>
        When a company enters voluntary administration or liquidation, directors lose control of the
        company. You still have duties. ASIC says directors must help by:
      </p>
      <ul>
        <li>telling the liquidator where company property is, and handing over any property you hold;</li>
        <li>providing the company&apos;s books and records, and saying where other records are kept;</li>
        <li>giving a report on the company&apos;s activities and property, within the short deadline the law sets;</li>
        <li>meeting or reporting to the liquidator when reasonably asked.</li>
      </ul>
      <p>
        A liquidator can also require a director to attend a creditors&apos; meeting, and can ask the
        court for a public examination under oath. Directors must not obstruct them.
      </p>

      <h2>Who they work for</h2>
      <p>
        A liquidator has a duty to the company&apos;s creditors as a whole. They also investigate the
        company&apos;s affairs and report to creditors. They are not your lawyer and they are not
        there to take your side against the creditors. That is why it helps to talk to one early,
        while there are still choices, and to tell them anything you are worried about up front.
      </p>

      <h2>Checking one before you call</h2>
      <ul>
        <li>Search ASIC&apos;s register and confirm the registration is current.</li>
        <li>Ask whether they have handled situations like yours, such as a Director Penalty Notice or a statutory demand.</li>
        <li>Ask what the first stage costs, what is included, and when you pay.</li>
        <li>You do not have to use the first one you speak to.</li>
      </ul>
      <p>
        <a href="/guides/before-you-speak-to-a-liquidator">A checklist for the first conversation</a>.
      </p>
    </GuideLayout>
  );
}
