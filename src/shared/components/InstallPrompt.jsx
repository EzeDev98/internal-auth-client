// Prompt offering to install the app as a PWA.
import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const REPROMPT_DELAY_MS = 5 * 60 * 1000;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    if (isStandalone) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isDismissed || !deferredPrompt) return undefined;
    const timer = setTimeout(() => setIsDismissed(false), REPROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isDismissed, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => setIsDismissed(true);

  if (!deferredPrompt || isDismissed) return null;

  return (
    <Modal
      isOpen
      onClose={dismiss}
      title="Install this app?"
      footer={(
        <>
          <Button variant="primary" onClick={handleInstall}>Install</Button>
          <Button variant="link" onClick={dismiss}>Not now</Button>
        </>
      )}
    >
      <p>Install the Internal Auth Admin Console for quick, app-like access.</p>
    </Modal>
  );
}
