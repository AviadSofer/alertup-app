import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#E4E4E4",
  },
  logo: {
    width: 120,
    marginBottom: 16,
    alignSelf: "center",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    flexDirection: "column",
  },
  tableRow: { flexDirection: "row" },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    flex: 1,
    padding: 4,
  },
  tableCell: { fontSize: 10 },
});

const PDFDocument = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src="/full-logo.png" style={styles.logo} />
      <View style={styles.table}>
        <View style={styles.tableRow}>
          {headers.map((header, i) => (
            <View style={styles.tableCol} key={i}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                {header}
              </Text>
            </View>
          ))}
        </View>
        {rows.map((row, i) => (
          <View style={styles.tableRow} key={i}>
            {row.map((cell, j) => (
              <View style={styles.tableCol} key={j}>
                <Text style={styles.tableCell}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default PDFDocument;
