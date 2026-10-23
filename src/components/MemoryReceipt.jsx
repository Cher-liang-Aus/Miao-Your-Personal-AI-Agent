import styles from './MemoryReceipt.module.css'

export default function MemoryReceipt({ items, onManage }) {
  if (!items?.length) return null

  return (
    <details className={styles.receipt}>
      <summary>
        <span className={styles.receiptIcon}>✧</span>
        <span>Context used</span>
        <span className={styles.count}>{items.length}</span>
        <span className={styles.view}>View sources</span>
      </summary>
      <div className={styles.details}>
        <p className={styles.intro}>These details shaped this reply.</p>
        {items.map(item => (
          <div className={styles.source} key={item.id}>
            <span className={styles.sourceDot} />
            <div>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
              <small>{item.source}</small>
            </div>
          </div>
        ))}
        <button className={styles.manage} onClick={onManage}>Manage this context</button>
      </div>
    </details>
  )
}
