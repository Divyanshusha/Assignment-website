import styles from './GlobeFallback.module.css'

/**
 * Static, dependency-free stand-in for the 3D globe. Rendered when WebGL is
 * unavailable or the Three.js canvas fails to initialise, so the hero keeps a
 * deliberate visual instead of an empty void. Purely decorative.
 */
export default function GlobeFallback() {
  return <div className={styles.orb} aria-hidden="true" />
}
