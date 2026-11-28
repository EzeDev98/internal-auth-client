// Shared heading for the auth screens.
import styles from './AuthHeading.module.css';

export default function AuthHeading({ title, subtitle }) {
  return (
    <div className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
