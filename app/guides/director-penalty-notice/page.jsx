import GuideLayout from '../../components/GuideLayout';
import { pageMeta } from '../../../lib/meta';

export const metadata = pageMeta({
  title: 'Director Penalty Notices: what the 21 days mean',
  description: 'What a Director Penalty Notice is, why the 21 days matter, which notices can still be cancelled and what to check first. Sourced from the ATO.',
  path: '/guides/director-penalty-notice',
});

const SOURCES = [
  {
    label: 'ATO: Director penalties',
    href: 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/engaging-a-worker/in-detail/director-penalty-regime',
  },
  {
    label: 'ASIC: Insolvency for directors (Information Sheet 42)',
    href: 'https://www.asic.gov.au/regulatory-resources/insolvency/insolvency-for-directors',
  },
];

export default function Guide() {
  return (
    <GuideLayout
      slug="director-penalty-notice"
      title="Director Penalty Notices: what the 21 days mean"
      description="What a Director Penalty Notice is, why the 21 days matter, which notices can still be cancelled, and what to check first."
      lead="A Director Penalty Notice, or DPN, is the ATO telling you that you may be personally responsible for some of your company's tax debts. The 21 days after it is issued is the window that matters most."
      sources={SOURCES}
    >
      <div className="ar-callout ar-callout-warn">
        <p>
          <strong>If you have a notice in your hand:</strong> the 21 days starts on the day the ATO
          posts it or leaves it at your company&apos;s ASIC address. It does not start on the day
          you open it. Check the date on the notice first.
        </p>
      </div>

      <h2>What a DPN is</h2>
      <p>
        Directors can be personally liable for some unpaid company debts. The ATO calls these
        amounts director penalties. They cover unpaid PAYG withholding, GST and the super guarantee
        charge.
      </p>
      <p>
        A DPN is a notice the ATO must give you before it can act to recover a director penalty. It
        lists the unpaid amounts and the ways the penalty can be cancelled. The ATO calls
        cancelling it &quot;remitting&quot; it.
      </p>

      <h2>The 21 days</h2>
      <p>
        You have 21 days from the day the notice is issued to take one of the actions it lists.
        After that, the ATO can recover the penalty from you personally. That can mean keeping your
        tax refunds, firmer action, or legal action.
      </p>
      <p>
        The ATO generally sends the notice to the address registered with ASIC. If that address is
        out of date, the notice can land somewhere you never see it, and the clock still runs. It
        is worth checking your company&apos;s ASIC details now, before you need to.
      </p>

      <h2>Why the lodgement date matters</h2>
      <p>
        What you can do depends on when the debt was reported to the ATO. Advisers often call these
        a non-lockdown DPN and a lockdown DPN.
      </p>
      <ul>
        <li>
          <strong>Reported within 3 months of the due date.</strong> You can have the penalty
          cancelled within the 21 days if the company pays the amount in full, or an administrator
          is appointed, or a small business restructuring practitioner is appointed, or the company
          begins to be wound up.
        </li>
        <li>
          <strong>Reported more than 3 months late, or not reported at all.</strong> The penalty can
          only be cancelled by paying the company&apos;s debt in full. Appointing a liquidator or
          administrator does not remove it.
        </li>
      </ul>
      <p>
        If a BAS or super statement was late or never lodged, you may be in the second group. That
        is why many advisers say to lodge on time even when you cannot pay.
      </p>

      <h2>The options, in plain terms</h2>
      <ul>
        <li><strong>Pay.</strong> The company pays the amount in full.</li>
        <li>
          <strong>Voluntary administration.</strong> A registered liquidator takes control for a
          short time to try to save the company or its business.
        </li>
        <li>
          <strong>Small business restructuring.</strong> An eligible small company agrees a plan
          with creditors, and the directors keep control.{' '}
          <a href="/guides/small-business-restructuring">Who can use it</a>.
        </li>
        <li>
          <strong>Liquidation.</strong> A registered liquidator takes control and winds the company
          up. Directors lose control of the company.{' '}
          <a href="/guides/what-a-liquidator-does">What a liquidator does</a>.
        </li>
      </ul>

      <h2>Defences</h2>
      <p>
        Even after the 21 days, some directors have a defence. The ATO lists three. You did not take
        part in managing the company because of illness or another good reason. Or you took all
        reasonable steps to make sure the company paid, or that an administrator, restructuring
        practitioner or liquidator was appointed. Or, for GST and super guarantee charge only, the
        company applied the law in a way that could reasonably be argued to be lawful and took
        reasonable care.
      </p>
      <p>
        Defences are narrow. Relying on someone else to handle it is not a defence, and resigning as
        a director does not cancel a penalty that has already arisen. You raise a defence in writing
        with the ATO.
      </p>

      <h2>What to do this week</h2>
      <ol>
        <li>Find the date on the notice and count 21 days from it.</li>
        <li>Check whether your company&apos;s BAS and super were lodged on time.</li>
        <li>
          Talk to a registered liquidator, or an accountant or lawyer who handles insolvency, as
          early as you can. ASIC says to get advice early rather than hoping things improve.
        </li>
        <li>Make sure the company&apos;s address on ASIC&apos;s register is correct.</li>
      </ol>
    </GuideLayout>
  );
}
