import { useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import styles from './AnimatedOutlet.module.css';

// UX smoothness plan Step 4b - the one central route-transition wrapper for
// the whole app. Adapted from sync-point-client's AnimatedRoutes.jsx, not
// copied: sync-point renders a single top-level <Routes location={...}>
// tree, but this app's routing (src/app/App.jsx) is a single top-level
// <Routes> with nested layout routes (AuthLayout, AppShell) that each
// render their own <Outlet/> for whichever child route matched - there's
// no second <Routes> call to hand a delayed location to. useOutlet() is
// the react-router hook for exactly that shape: it returns the actual
// matched route element (the same thing <Outlet/> would render), so this
// component can hold onto the *previous* matched element while the new
// one loads, then swap after the exit transition finishes - same idea as
// AnimatedRoutes, applied at the Outlet level instead of the Routes level.
//
// Not wired into App.jsx yet - Step 5b replaces every <Outlet/> in
// AuthLayout and AppShell with <AnimatedOutlet/>.
const EXIT_DURATION_MS = 160;

export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  const [displayLocation, setDisplayLocation] = useState(location);
  const [displayOutlet, setDisplayOutlet] = useState(outlet);
  const [stage, setStage] = useState('enter');

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) {
      // Same route (e.g. only the outlet's own internal state changed) -
      // swap immediately, no exit/enter cycle.
      setDisplayOutlet(outlet);
      return undefined;
    }

    setStage('exit');

    const timeoutId = setTimeout(() => {
      setDisplayLocation(location);
      setDisplayOutlet(outlet);
      setStage('enter');
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [location, displayLocation, outlet]);

  return (
    <div className={[styles.wrapper, stage === 'exit' ? styles.exit : styles.enter].join(' ')}>
      {displayOutlet}
    </div>
  );
}
