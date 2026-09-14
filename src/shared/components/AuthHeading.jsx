import styles from './AuthHeading.module.css';

// The 4 auth screens (Login, Register, Forgot/Reset password) each went
// straight from the card's top edge into the first field, with nothing
// establishing a visual hierarchy first - that's what read as "pressed"/
// flat next to a reference with a bold heading + subtitle before its
// fields. This is that same presentation pattern, kept generic so each
// page supplies its own title/subtitle rather than copying anyone else's
// wording.
export default function AuthHeading({ title, subtitle }) {
  return (
    <div className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
