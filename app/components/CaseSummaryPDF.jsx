import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#211530' },
  header: { marginBottom: 20, borderBottom: '2px solid #392061', paddingBottom: 12 },
  wordmark: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#392061' },
  tagline: { fontSize: 8, color: '#6B5F7A', marginTop: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 4 },
  meta: { fontSize: 9, color: '#6B5F7A', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 6, color: '#392061' },
  paragraph: { fontSize: 10, lineHeight: 1.5, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 160, color: '#6B5F7A' },
  value: { flex: 1 },
  disclaimer: {
    marginTop: 24, paddingTop: 12, borderTop: '1px solid #D9CDE3',
    fontSize: 8, color: '#6B5F7A', lineHeight: 1.4,
  },
});

// A human-readable label for every raw answer key, so the "Full answers"
// table below the prose summary reads clearly rather than showing the
// internal field names used in the code.
const FIELD_LABELS = {
  category: 'Reason for contact',
  noticeType: 'Notice type',
  dpnLodged: 'Lodgements on time',
  worriedSuper: 'Wages/super current',
  superBehindLength: 'How long behind',
  worriedSuppliers: 'Supplier payment terms',
  closeSolvency: 'Can pay debts in full',
  closeStoppedTrading: 'Stopped trading',
  closeDebts: 'Has debts',
  closeLodgements: 'Lodgements current',
  debtScale: 'Total debt scale',
  entitlementsOk: 'Entitlements currently paid',
  lodgementsOk: 'Tax lodgements current',
  viability: 'Director’s own view on viability',
  assetsValue: 'Asset value range',
  loanAccount: 'Director/company loan position',
  creditorCount: 'Approximate number of creditors',
  securityInterest: 'Registered security interest (PPSR)',
};

export default function CaseSummaryPDF({ clientName, practitionerName, aiSummary, noticeType, noticeDate, notes, pathway, answers, createdAt }) {
  const answerRows = Object.entries(answers || {}).filter(([key]) => FIELD_LABELS[key]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>AnteRoom</Text>
        </View>

        <Text style={styles.title}>Case Summary</Text>
        <Text style={styles.meta}>
          Prepared for {practitionerName}, {new Date(createdAt).toLocaleDateString('en-AU')}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text style={styles.value}>{clientName}</Text></View>
          {pathway && <View style={styles.row}><Text style={styles.label}>Likely pathway</Text><Text style={styles.value}>{pathway}</Text></View>}
          {noticeType && <View style={styles.row}><Text style={styles.label}>Notice type</Text><Text style={styles.value}>{noticeType}</Text></View>}
          {noticeDate && <View style={styles.row}><Text style={styles.label}>Notice date</Text><Text style={styles.value}>{noticeDate}</Text></View>}
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.paragraph}>{aiSummary}</Text>

        {notes && (
          <>
            <Text style={styles.sectionTitle}>Additional notes from client</Text>
            <Text style={styles.paragraph}>{notes}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Full triage responses</Text>
        {answerRows.map(([key, value]) => (
          <View style={styles.row} key={key}>
            <Text style={styles.label}>{FIELD_LABELS[key]}</Text>
            <Text style={styles.value}>{String(value)}</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          This summary is based on information self-reported by the client through AnteRoom's
          triage tool and has not been independently verified. It is provided as background only,
          to support, not replace, your own independent professional assessment. It does not
          constitute financial, legal, accounting or insolvency advice, and does not determine
          whether the company is insolvent.
        </Text>
      </Page>
    </Document>
  );
}
