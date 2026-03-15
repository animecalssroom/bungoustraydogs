import { DistrictModel } from '@/backend/models/district.model'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function DistrictsPage() {
  const districts = await DistrictModel.getAll()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>横浜の地図 · Map of Yokohama</p>
        <h1 className={styles.title}>Territory <em>Analysis</em></h1>
        <div className="ink-divider" />
        <p className={styles.subtitle}>
          The city is partitioned not by lines on a map, but by the influence of the three powers.
        </p>
      </header>

      <div className={styles.grid}>
        {districts.map((district) => (
          <section key={district.id} className={`${styles.card} paper-surface diagonal-card`}>
            <div className={styles.cardHeader}>
              <span className={styles.districtId}>S-ID: {district.id.toUpperCase()}</span>
              <h2 className={styles.districtName}>{district.name}</h2>
            </div>
            <p className={styles.description}>{district.description}</p>
            <div className={styles.statusLine}>
              <span className={styles.statusLabel}>Visibility:</span>
              <span className={styles.statusValue}>Unrestricted</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
