// Prompt to reload when a new app version is available.
import { useRegisterSW } from 'virtual:pwa-register/react';
import Modal from './Modal';
import Button from './Button';

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
      console.error('Service worker registration failed', error);
    },
  });

  const dismiss = () => setNeedRefresh(false);

  const handleUpdate = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch {
    }
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
