// Route outlet with page transition animation.
import { useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import styles from './AnimatedOutlet.module.css';

const EXIT_DURATION_MS = 160;

export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  const [displayLocation, setDisplayLocation] = useState(location);
  const [displayOutlet, setDisplayOutlet] = useState(outlet);
  const isLeaving = location.pathname !== displayLocation.pathname;

  if (!isLeaving && outlet !== displayOutlet) {
    setDisplayOutlet(outlet);
  }

  useEffect(() => {
    if (!isLeaving) return undefined;

    const timeoutId = setTimeout(() => {
      setDisplayLocation(location);
      setDisplayOutlet(outlet);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [isLeaving, location, outlet]);

  return (
    <div className={[styles.wrapper, isLeaving ? styles.exit : styles.enter].join(' ')}>
      {isLeaving ? displayOutlet : outlet}
    </div>
  );
}
