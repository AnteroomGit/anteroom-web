// Human-readable question text and option labels for every key that can
// appear in a stored triage_answers/answers object.
//
// Deliberately NOT imported live from the TRIAGE object in app/page.jsx,
// even though that would avoid duplicating this data. page.jsx's default
// export is the entire triage engine (question routing, pathway logic,
// the whole booking flow) -- reaching into it from another page for a
// purely presentational lookup would be real risk for no real benefit.
// If the real questions or option wording in page.jsx ever change,
// update this file's copy by hand to match.

export const QUESTION_LABELS = {
  category: {
    question: "What's going on?",
    values: {
      money: "I'm worried about my money",
      ato: "I've received something from the ATO",
      debts: "I can't pay my debts",
      close: 'I want to close my business',
    },
  },
  noticeType: {
    question: 'What did you receive?',
    values: { dpn: 'Director Penalty Notice', garnishee: 'Garnishee notice', statutory: 'Statutory demand', unsure: 'Not sure' },
  },
  dpnLodged: {
    question: 'Were your BAS and super lodgements submitted on time?',
    values: { onTime: 'Yes, on time', late: 'No, they were late', unsure: 'Not sure' },
  },
  worriedSuper: {
    question: 'Are wages and super up to date?',
    values: { current: 'Yes', behind: 'No' },
  },
  superBehindLength: {
    question: 'How long has super been behind?',
    values: { short: 'Under 2 weeks', medium: '2\u20136 weeks', long: 'More than 6 weeks' },
  },
  worriedSuppliers: {
    question: 'Paying suppliers on normal terms?',
    values: { normal: 'Yes, normal terms', stretched: 'Stretching it out' },
  },
  closeSolvency: {
    question: 'Can the business pay everything it owes, in full?',
    values: { yes: 'Yes, in full', no: 'No', notsure: 'Not sure' },
  },
  closeStoppedTrading: {
    question: 'Has the company stopped trading?',
    values: { yes: 'Yes', no: 'No, still trading' },
  },
  closeDebts: {
    question: 'Any debts at all right now?',
    values: { no: 'No debts', yes: 'Some, but fully payable' },
  },
  closeLodgements: {
    question: 'All tax returns and BAS lodgements up to date?',
    values: { yes: 'Yes', no: 'No' },
  },
  debtScale: {
    question: 'Roughly, what would you estimate total business debts to be?',
    values: { under: 'Under $1 million', over: '$1 million or more', unsure: 'Not sure' },
  },
  entitlementsOk: {
    question: 'Are all wages and super currently due actually paid?',
    values: { yes: 'Yes', no: 'No' },
  },
  lodgementsOk: {
    question: 'Are tax lodgements (BAS, tax returns) up to date?',
    values: { yes: 'Yes', no: 'No' },
  },
  viability: {
    question: 'Do you think the business is still viable, or is it time to close it?',
    values: { viable: 'Still viable, worth exploring', close: 'Time to close it down', notsure: 'Not sure' },
  },
  assetsValue: {
    question: 'Roughly what are the company\u2019s assets worth?',
    values: { under1000: 'Under $1,000', '1kto10k': '$1,000\u2013$10,000', '10kto100k': '$10,000\u2013$100,000', over100k: 'Over $100,000' },
  },
  loanAccount: {
    question: 'Do you personally owe the company money, or does the company owe you?',
    values: { directorOwes: 'I owe the company', companyOwes: 'The company owes me', neither: 'Neither', notsure: 'Not sure' },
  },
  creditorCount: {
    question: 'Roughly how many people or businesses does the company owe money to?',
    values: { few: '1\u20132', some: '3\u201310', many: '10+' },
  },
  securityInterest: {
    question: 'Has anyone registered a formal claim over your assets?',
    values: { yes: 'Yes', no: 'No', notsure: 'Not sure' },
  },
};

export function getQuestionText(key) {
  return QUESTION_LABELS[key]?.question || key;
}

export function getAnswerLabel(key, value) {
  return QUESTION_LABELS[key]?.values?.[value] || String(value);
}
