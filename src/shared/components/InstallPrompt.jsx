import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

// Re-shown 5 minutes after a dismiss, repeating until installed - see the
// re-arming effect below.
const REPROMPT_DELAY_MS = 5 * 60 * 1000;

// Install-prompt feature. beforeinstallprompt only fires in Chromium-based
// browsers (Chrome, Edge, Samsung Internet, ...) that haven't already
// installed the app and aren't already running as the installed app -
// there's no equivalent programmatic event in Safari/iOS, so this modal
// simply never appears there; installing is still possible through
// Safari's own "Add to Home Screen" menu, just not prompt-able from code.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari's own flag; undefined (falsy) elsewhere

    if (isStandalone) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      // Stops Chromium's own mini-infobar so this modal is the only
      // install prompt shown, and keeps the event around so `Install`
      // can trigger the real native prompt later, on click.
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

  // Re-arms itself every time a dismiss happens: whenever isDismissed
  // flips true (and the prompt is still installable), start a fresh
  // 5-minute timer that flips it back to false, which re-shows the modal.
  // Naturally stops repeating once deferredPrompt clears - either the app
  // gets installed (handleAppInstalled above) or the captured event goes
  // stale for some other reason.
  useEffect(() => {
    if (!isDismissed || !deferredPrompt) return undefined;
    const timer = setTimeout(() => setIsDismissed(false), REPROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isDismissed, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // A `beforeinstallprompt` event can only be prompted once - whether
    // the person accepted or dismissed the native dialog, this one is
    // spent, so drop it either way (this also stops the re-arm effect,
    // since deferredPrompt becomes null).
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
