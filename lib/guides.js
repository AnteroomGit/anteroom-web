// The guides, in the order they appear on the homepage, the guides index and
// the footer. Each one has its own page at /guides/<slug>. `short` is the
// label used in the footer. The description here is for lists. The longer
// description for search results is written on the page itself.
export const GUIDES = [
  {
    slug: 'director-penalty-notice',
    title: 'Director Penalty Notices: what the 21 days mean',
    short: 'Director Penalty Notices',
    description: 'What a notice is, the two types, and what can stop the debt becoming yours personally.',
  },
  {
    slug: 'statutory-demand',
    title: 'Statutory demands: the 21 day rule',
    short: 'Statutory demands',
    description: 'What a demand is, why the deadline matters, and what setting one aside involves.',
  },
  {
    slug: 'what-a-liquidator-does',
    title: 'What a registered liquidator does',
    short: 'What a liquidator does',
    description: 'What they do, when directors usually call one, and what to expect from a first conversation.',
  },
  {
    slug: 'small-business-restructuring',
    title: 'Small business restructuring: who can use it',
    short: 'Small business restructuring',
    description: 'The eligibility rules, how the plan works and what it means for the business.',
  },
  {
    slug: 'before-you-speak-to-a-liquidator',
    title: 'Before you speak to a liquidator',
    short: 'Before you call a liquidator',
    description: 'What to gather and what to ask, so the first conversation is useful.',
  },
];

// The day every fact in the guides was last checked against the sources listed
// at the bottom of each guide. Update this when you re-check them, and change
// the wording of a guide if a source has changed.
export const GUIDES_CHECKED = { label: '24 November 2026', iso: '2026-11-24' };
