import styles from './TruckFallback.module.css'

/**
 * Static, dependency-free stand-in for the 3D truck. Rendered when WebGL is
 * unavailable, the Three.js canvas fails to initialise, or the user prefers
 * reduced motion — so the journey section keeps a deliberate visual instead of
 * an empty void. Purely decorative.
 */
export default function TruckFallback() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <svg
        className={styles.truck}
        viewBox="0 0 240 120"
        role="presentation"
        focusable="false"
      >
        <line className={styles.road} x1="0" y1="100" x2="240" y2="100" />
        {/* trailer */}
        <rect x="20" y="34" width="120" height="52" rx="4" fill="#c7d0dd" />
        <rect x="20" y="54" width="120" height="10" fill="#ff6a2c" />
        {/* cab */}
        <path
          d="M150 40 h30 l18 20 v26 h-48 z"
          fill="#ff6a2c"
          strokeLinejoin="round"
        />
        <rect x="176" y="46" width="16" height="14" rx="2" fill="#8fe3f7" />
        {/* wheels */}
        <circle cx="52" cy="92" r="13" fill="#0d1119" />
        <circle cx="52" cy="92" r="4" fill="#93a0b4" />
        <circle cx="104" cy="92" r="13" fill="#0d1119" />
        <circle cx="104" cy="92" r="4" fill="#93a0b4" />
        <circle cx="172" cy="92" r="13" fill="#0d1119" />
        <circle cx="172" cy="92" r="4" fill="#93a0b4" />
      </svg>
    </div>
  )
}
