'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Don't show if user previously dismissed
    if (localStorage.getItem('install-prompt-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If the browser event doesn't fire after 3 seconds, show manual instructions
    const timeout = setTimeout(() => {
      setShowManual(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowManual(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowManual(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Already installed or user dismissed
  if (dismissed) return null;
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return null;

  // Nothing to show yet
  if (!deferredPrompt && !showManual) return null;

  // Previously dismissed
  if (typeof window !== 'undefined' && localStorage.getItem('install-prompt-dismissed')) return null;

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    zIndex: 9999,
    background: '#7C9070',
    color: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    fontFamily: 'Inter, sans-serif',
  };

  // If the browser gave us the install prompt, show the quick Install button
  if (deferredPrompt) {
    return (
      <div style={bannerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
            Install <strong>Daily Walk</strong> on your phone
          </span>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              style={{
                background: 'white',
                border: 'none',
                color: '#7C9070',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: show manual install instructions
  return (
    <div style={bannerStyle}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <strong style={{ fontSize: '15px' }}>Install Daily Walk</strong>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 0 0 8px',
            lineHeight: '1',
          }}
        >
          ✕
        </button>
      </div>
      <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
        <li>Tap the <strong>menu</strong> (3 dots ⋮) in Chrome</li>
        <li>Tap <strong>&quot;Add to Home screen&quot;</strong></li>
        <li>Tap <strong>Add</strong></li>
      </ol>
      <p style={{ margin: '10px 0 0', fontSize: '12px', opacity: 0.8 }}>
        On Samsung Internet: tap the menu icon → Add page to → Home screen
      </p>
    </div>
  );
}
