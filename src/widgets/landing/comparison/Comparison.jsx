import { Container } from '@/shared/ui'
import { COMPARISON_CONTENT } from '@/pages/landing'
import styles from './Comparison.module.css'

export const Comparison = () => {
  return (
    <section
      id="comparison"
      className={styles.comparisonSection}
      aria-labelledby="comparison-title"
    >
      <Container>
        <h2 id="comparison-title" className={styles.title}>
          {COMPARISON_CONTENT.title}
        </h2>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.th}>{COMPARISON_CONTENT.columns.stage}</th>
                <th className={styles.th}>{COMPARISON_CONTENT.columns.before}</th>
                <th className={styles.th}>{COMPARISON_CONTENT.columns.withProofFlow}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_CONTENT.rows.map((row) => (
                <tr key={row.stage} className={styles.row}>
                  <td className={styles.td}>{row.stage}</td>
                  <td className={styles.td}>{row.before}</td>
                  <td className={styles.td}>{row.withProofFlow}</td>
                </tr>
              ))}
              <tr className={styles.summaryRow}>
                <td className={`${styles.td} ${styles.summaryTd}`}>
                  {COMPARISON_CONTENT.summaryRow.stage}
                </td>
                <td className={`${styles.td} ${styles.summaryTd}`}>
                  {COMPARISON_CONTENT.summaryRow.before}
                </td>
                <td className={`${styles.td} ${styles.summaryTd}`}>
                  <span className={styles.summaryHighlight}>
                    {COMPARISON_CONTENT.summaryRow.withProofFlow}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.mobileCardsList} aria-hidden="true">
          {COMPARISON_CONTENT.rows.map((row) => (
            <div key={row.stage} className={styles.mobileCard}>
              <div className={styles.mobileCardTitle}>{row.stage}</div>
              <div className={styles.mobileCardField}>
                <span className={styles.mobileCardLabel}>{COMPARISON_CONTENT.columns.before}</span>
                <span className={styles.mobileCardText}>{row.before}</span>
              </div>
              <div className={styles.mobileCardField}>
                <span className={styles.mobileCardLabel}>
                  {COMPARISON_CONTENT.columns.withProofFlow}
                </span>
                <span className={styles.mobileCardTextStrong}>{row.withProofFlow}</span>
              </div>
            </div>
          ))}

          <div className={`${styles.mobileCard} ${styles.mobileSummaryCard}`}>
            <div className={styles.mobileCardTitle}>{COMPARISON_CONTENT.summaryRow.stage}</div>
            <div className={styles.mobileCardField}>
              <span className={styles.mobileCardLabel}>{COMPARISON_CONTENT.columns.before}</span>
              <span className={styles.mobileCardText}>{COMPARISON_CONTENT.summaryRow.before}</span>
            </div>
            <div className={styles.mobileCardField}>
              <span className={styles.mobileCardLabel}>
                {COMPARISON_CONTENT.columns.withProofFlow}
              </span>
              <span className={styles.summaryHighlight}>
                {COMPARISON_CONTENT.summaryRow.withProofFlow}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
