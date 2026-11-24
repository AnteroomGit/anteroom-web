import GuideLayout from '../../components/GuideLayout';
import { pageMeta } from '../../../lib/meta';

export const metadata = pageMeta({
  title: 'Statutory demands: the 21 day rule',
  description: 'What a statutory demand is, why its 21 days cannot be extended, your options, and what happens if the deadline passes. Sourced from the ATO and courts.',
  path: '/guides/statutory-demand',
});

const SOURCES = [
  {
    label: 'Federal Court of Australia: Corporations Information Sheet 1 (statutory demands)',
    href: 'https://fedcourt.gov.au/law-and-practice/guides/corporations-guides/information-sheet-1',
  },
  {
    label: 'ATO: Legal action we may take',
    href: 'https://www.ato.gov.au/individuals-and-families/paying-the-ato/if-you-don-t-pay/legal-action-we-may-take',
  },
  {
    label: 'Explanatory Statement, Corporations Amendment (Statutory Minimum) Regulations 2021 (the $4,000 minimum)',
    href: 'https://legislation.gov.au/F2021L00660/asmade/2021-05-28/es/original/pdf',
  },
];

export default function Guide() {
  return (
    <GuideLayout
      slug="statutory-demand"
      title="Statutory demands: the 21 day rule"
      description="What a statutory demand is, why its 21 days cannot be extended, the options you have, and what happens if the deadline passes."
      lead="A statutory demand is a formal letter from a creditor, sometimes the ATO, asking a company to pay a debt within 21 days. The deadline is strict, and what you do inside it decides what happens next."
      sources={SOURCES}
    >
      <div className="ar-callout ar-callout-warn">
        <p>
          <strong>If you have just been served with one:</strong> the 21 days runs from the day the
          demand was served on the company. A court application to set it aside has to be filed and
          served inside that time, and the courts generally cannot extend it.
        </p>
      </div>

      <h2>What a statutory demand is</h2>
      <p>
        It is a creditor&apos;s formal written request that a company pay a debt within 21 days of
        being served. It is addressed to the company, not to you personally. The debt, or several
        debts added together, has to be due and payable and at least $4,000. That minimum has been
        $4,000 since 1 July 2021.
      </p>

      <h2>Who can send one</h2>
      <p>
        Any creditor can, including the ATO. The ATO can issue a statutory demand to a company that
        has not paid its debts. It asks the company to pay the whole debt, or enter a payment plan,
        within 21 days.
      </p>

      <h2>What you can do in the 21 days</h2>
      <ul>
        <li><strong>Pay the debt.</strong> That ends the demand.</li>
        <li>
          <strong>Make an arrangement.</strong> With the ATO that means a payment plan. With other
          creditors it means whatever they will agree to. Get any agreement in writing.
        </li>
        <li>
          <strong>Ask the court to set it aside.</strong> If you believe the company does not owe
          the money, or owes less, it can apply to the court. The application, with a supporting
          affidavit, has to be filed with the court and served on the creditor within the 21 days.
        </li>
      </ul>
      <p>
        If you do apply to set the demand aside, the time to comply is extended while the court
        decides. If the application is dismissed, the company generally has 7 more days to comply,
        unless the court says otherwise.
      </p>

      <h2>When a court will set one aside</h2>
      <p>The court can set a demand aside if:</p>
      <ul>
        <li>there is a genuine dispute about the debt;</li>
        <li>the company has an offsetting claim against the creditor;</li>
        <li>there is a defect in the demand that would cause substantial injustice; or</li>
        <li>there is some other good reason.</li>
      </ul>
      <p>
        Courts look for real disputes. A debt the company does owe, and cannot pay, is unlikely to
        be set aside.
      </p>

      <h2>If the 21 days pass</h2>
      <p>
        The company is presumed to be insolvent. The creditor can then apply to the court to wind
        the company up, generally within three months of the day the 21 days ran out. If the court
        makes that order, a liquidator is appointed and takes control of the company.
      </p>
      <p>
        That is the point where many directors first look for help. It is much easier to talk to a
        registered liquidator before the deadline than after an application is filed.{' '}
        <a href="/guides/what-a-liquidator-does">What a liquidator does</a>.
      </p>

      <h2>What to do this week</h2>
      <ol>
        <li>Find the date the demand was served and count 21 days from it. Put the date in your diary.</li>
        <li>Check the debt. Is the amount right? Is any of it disputed? Does the company have a claim against the creditor?</li>
        <li>If it is an ATO demand, contact the ATO about a payment plan straight away.</li>
        <li>Get advice that week from a registered liquidator or a lawyer. The court deadline cannot be moved.</li>
        <li>If the company cannot pay, ask about the formal options, such as administration, liquidation or small business restructuring.</li>
      </ol>
    </GuideLayout>
  );
}
