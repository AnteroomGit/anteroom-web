import GuideLayout from '../../components/GuideLayout';
import { pageMeta } from '../../../lib/meta';

export const metadata = pageMeta({
  title: 'Small business restructuring: who can use it',
  description: 'Who can use small business restructuring: the $1 million limit, the lodgement and employee rules, how long it takes, and how it relates to a DPN.',
  path: '/guides/small-business-restructuring',
});

const SOURCES = [
  {
    label: 'ASIC: FAQs on small business restructuring',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors/faqs-small-business-restructuring',
  },
  {
    label: 'ASIC: Small business restructuring and the restructuring plan',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors/restructuring-and-the-restructuring-plan/',
  },
  {
    label: 'Treasury: Simplified debt restructuring, a factsheet for small business',
    href: 'https://treasury.gov.au/sites/default/files/2021-04/simplified_debt_restructuring_v2.pdf',
  },
  {
    label: 'ATO: Director penalties',
    href: 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/engaging-a-worker/in-detail/director-penalty-regime',
  },
];

export default function Guide() {
  return (
    <GuideLayout
      slug="small-business-restructuring"
      title="Small business restructuring: who can use it"
      description="Who can use small business restructuring: the $1 million limit, the lodgement and employee rules, how long it takes, and how it relates to a DPN."
      lead="Small business restructuring, or SBR, lets an eligible company with debts of $1 million or less put a plan to its creditors while the directors stay in control of the business."
      sources={SOURCES}
    >
      <h2>What it is</h2>
      <p>
        SBR is a formal process for small companies in financial difficulty. A registered liquidator
        is appointed as the restructuring practitioner. They help the company develop a restructuring
        plan, and the creditors decide whether to accept it. You stay in control of the company
        while you work with the practitioner.
      </p>

      <h2>Who can use it</h2>
      <p>The company needs to meet all of these:</p>
      <ul>
        <li>
          <strong>Debts of $1 million or less</strong> on the day the practitioner is appointed.
          Employee entitlements are not counted towards the limit.
        </li>
        <li>
          <strong>Employee entitlements that are due and payable have been paid.</strong> That
          covers wages and super that are due.
        </li>
        <li>
          <strong>Tax paperwork is in.</strong> The company has lodged its required tax returns,
          notices and statements, or has substantially done so. The tax itself does not have to be
          paid for the company to be eligible, but the lodgements do have to be done.
        </li>
        <li>
          <strong>The company is insolvent or likely to become insolvent,</strong> and the directors
          resolve that.
        </li>
      </ul>
      <p>
        There is also a seven year rule. You cannot use SBR if you have been a director of a
        company that used SBR or the simplified liquidation process in the last seven years.
      </p>

      <h2>How it works, and how long it takes</h2>
      <ol>
        <li>The company appoints a restructuring practitioner, who must be a registered liquidator.</li>
        <li>There is generally 20 business days to develop the plan and put it to creditors.</li>
        <li>Creditors then generally have up to 15 business days to decide whether to accept it.</li>
        <li>If they accept, the plan can run for up to three years.</li>
      </ol>
      <p>
        If creditors reject the plan, the company cannot propose another one. That makes the
        first plan important, and it is a good reason to work it through with the practitioner
        before it is put to a vote.
      </p>

      <h2>How it relates to a Director Penalty Notice</h2>
      <p>
        If a company gets a Director Penalty Notice for amounts that were reported to the ATO within
        3 months of the due date, appointing a small business restructuring practitioner within the
        21 days can cancel the director penalty. If the amounts were reported late or never, it
        cannot. Only paying the company&apos;s debt in full cancels the penalty in that case.{' '}
        <a href="/guides/director-penalty-notice">More on Director Penalty Notices</a>.
      </p>

      <h2>When it is not the right fit</h2>
      <p>
        SBR deals with old debt. It does not fix a business that keeps losing money. ASIC warns
        that if a business is consistently loss-making, has too little working capital, or cannot
        meet its future tax and employee obligations, restructuring the existing debt may only delay
        the problem. A registered liquidator can tell you honestly whether it suits your company or
        whether another path makes more sense.
      </p>
    </GuideLayout>
  );
}
