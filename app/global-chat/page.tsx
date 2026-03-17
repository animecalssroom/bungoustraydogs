'use client'

import GlobalChat from '@/frontend/components/chat/GlobalChat'
import styles from './page.module.css'

export default function GlobalChatPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>PUBLIC CHANNEL</h1>
        <p className={styles.subtitle}>Unencrypted transmission feed for all Yokohama residents.</p>
      </header>
      
      <main className={styles.chatWrapper}>
        <GlobalChat />
      </main>
      
      <aside className={styles.identityNote}>
        <div className={styles.noteTitle}>REGISTRY NOTICE</div>
        <p>All transmissions on this channel are logged by the Special Division. Identities are broadcast as registered in the municipal ability user database.</p>
      </aside>
    </div>
  )
}
