import { useRegisterSW } from 'virtual:pwa-register/react';
import Modal from './Modal';
import Button from './Button';

// App-update feature. vite.config.js sets registerType: 'prompt' + a
// per-build cacheId, so a new deploy always produces a genuinely
// different service worker file, installs it in the background, and
// leaves it "waiting" instead of activating on its own - useRegisterSW's
// needRefresh flips true exactly when that waiting worker shows up.
//
// This is a long-lived admin console people tend to leave open in a tab,
// so nothing here relies on the browser's own "check for a new SW on
// navigation" behavior - onRegisteredSW polls registration.update()
// hourly so an open tab still notices a deploy that happened while it
// sat idle.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.error('Service worker registration failed', error);
    },
  });

  const dismiss = () => setNeedRefresh(false);

  const handleUpdate = async () => {
    // Belt-and-suspenders: the new service worker's own activation already
    // drops any outdated Workbox-managed caches (cleanupOutdatedCaches is
    // on by default), but this app precaches nothing at all
    // (vite.config.js's globPatterns: []), so it's safe to also clear
    // every Cache Storage entry outright here rather than rely on that.
    // Deliberately NOT touching localStorage/sessionStorage - those can
    // hold legitimate app state (not build/asset staleness), and clearing
    // them isn't what "stale old state" means here.
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch {
      // Best-effort only - updateServiceWorker below is what actually
      // matters, and the new SW's own cache cleanup is the real safety net.
    }
    // Activates the waiting worker (skipWaiting) and reloads the page once
    // it takes control, picking up the new build's freshly hashed JS/CSS.
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <Modal
      isOpen
      onClose={dismiss}
      title="Update available"
      footer={(
        <>
          <Button variant="primary" onClick={handleUpdate}>Update now</Button>
          <Button variant="link" onClick={dismiss}>Later</Button>
        </>
      )}
    >
      <p>
        A new version of the Internal Auth Admin Console is ready. Update now to get the
        latest changes - this reloads the page.
      </p>
    </Modal>
  );
}
