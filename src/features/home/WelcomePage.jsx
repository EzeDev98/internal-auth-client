// Landing page shown after login.
import logo from '../../assets/sidebar-logo.png';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  return (
    <div className={styles.welcome}>
      <img src={logo} alt="" className={styles.logo} />
      <h1 className={styles.title}>Welcome to Internal Auth</h1>
      <p className={styles.subtitle}>
        Use the menu items in the left navigation bar to manage clients, users, roles, and more.
      </p>
    </div>
  );
}
