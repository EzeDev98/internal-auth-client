import logo from '../../assets/sidebar-logo.png';
import styles from './WelcomePage.module.css';

// The app-root landing page. Login (and any authenticated visit to "/")
// lands here instead of on a specific section like Clients, so nothing in
// the sidebar is the "current" route and none of it reads as focused/active
// by default - the user picks where to go from the nav instead.
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
