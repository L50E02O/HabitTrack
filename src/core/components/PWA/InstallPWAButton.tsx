import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './InstallPWAButton.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Componente que muestra el botón para instalar la PWA
 * Solo aparece cuando la app es instalable y el evento beforeinstallprompt se dispara
 */
export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [installabilityStatus, setInstallabilityStatus] = useState<string>('Verificando...');

  useEffect(() => {
    console.log('[INSTALL] Componente InstallPWAButton montado');
    
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      // Verificar si está en modo standalone (instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      const installed = isStandalone || isInWebAppiOS || isInWebAppChrome;
      
      console.log('[INSTALL] Verificando si está instalado:', {
        isStandalone,
        isInWebAppiOS,
        isInWebAppChrome,
        installed,
        userAgent: navigator.userAgent
      });
      
      setIsInstalled(installed);
      
      if (installed) {
        console.log('[INSTALL] La app ya está instalada');
        setInstallabilityStatus('Ya instalada');
        return;
      }
    };

    checkIfInstalled();

    // Helper: Verificar iconos en manifest
    const verifyIconsInManifest = async (manifest: any): Promise<boolean> => {
      if (!manifest.icons || manifest.icons.length === 0) {
        return false;
      }

      console.log('[INSTALL] Iconos en manifest:', manifest.icons);
      for (const icon of manifest.icons) {
        try {
          const iconResponse = await fetch(icon.src);
          if (!iconResponse.ok) {
            console.error(`[INSTALL] Icono no accesible: ${icon.src} (${iconResponse.status})`);
          } else {
            console.log(`[INSTALL] Icono accesible: ${icon.src}`);
          }
        } catch (iconError) {
          console.error(`[INSTALL] Error verificando icono ${icon.src}:`, iconError);
        }
      }
      return true;
    };

    // Helper: Cargar manifest desde URL
    const loadManifestFromUrl = async (url: string): Promise<any | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error('[INSTALL] Error cargando manifest:', response.status, response.statusText);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error('[INSTALL] Error cargando manifest:', error);
        return null;
      }
    };

    // Helper: Verificar manifest
    const verifyManifest = async (): Promise<boolean> => {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!manifestLink) {
        console.warn('[INSTALL] No se encontró link al manifest en el HTML');
        return false;
      }

      const manifestUrl = manifestLink.href;
      console.log('[INSTALL] Manifest URL:', manifestUrl);
      
      let manifest = await loadManifestFromUrl(manifestUrl);
      
      // Fallback a manifest.json si falla
      if (!manifest) {
        manifest = await loadManifestFromUrl('/manifest.json');
        if (manifest) {
          console.log('[INSTALL] Manifest fallback cargado:', manifest);
        }
      }

      if (manifest) {
        console.log('[INSTALL] Manifest cargado:', {
          name: manifest.name,
          short_name: manifest.short_name,
          icons: manifest.icons?.length || 0,
          start_url: manifest.start_url,
          display: manifest.display
        });
        return await verifyIconsInManifest(manifest);
      }

      return false;
    };

    // Helper: Verificar Service Worker
    const verifyServiceWorker = async (): Promise<void> => {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[INSTALL] Service Worker listo:', registration.scope);
      } catch (error) {
        console.warn('[INSTALL] Service Worker no listo:', error);
      }
    };

    // Verificar criterios de instalabilidad
    const checkInstallability = async () => {
      console.log('[INSTALL] Verificando criterios de instalabilidad...');
      
      const checks = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        hasIcons: false,
      };

      // Verificar manifest e iconos
      checks.hasIcons = await verifyManifest();
      
      // Verificar Service Worker
      await verifyServiceWorker();

      const allChecksPass = Object.values(checks).every(check => check === true);
      console.log('[INSTALL] Todos los criterios pasan:', allChecksPass, checks);
      
      if (!allChecksPass) {
        const missingChecks = Object.entries(checks)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', ');
        setInstallabilityStatus(`Faltan requisitos: ${missingChecks}`);
      } else {
        setInstallabilityStatus('Lista para instalar (esperando evento beforeinstallprompt)');
      }
    };

    checkInstallability();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[INSTALL] Evento beforeinstallprompt recibido');
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowButton(true);
      setInstallabilityStatus('Lista para instalar - Botón disponible');
      
      console.log('[INSTALL] Prompt guardado, botón mostrado');
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      console.log('[INSTALL] App instalada exitosamente');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      setInstallabilityStatus('Instalada');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log periódico del estado
    const statusInterval = setInterval(() => {
      console.log('[INSTALL] Estado actual:', {
        showButton,
        isInstalled,
        hasDeferredPrompt: deferredPrompt !== null,
        status: installabilityStatus
      });
    }, 10000); // Cada 10 segundos

    return () => {
      console.log('[INSTALL] Componente desmontado, limpiando listeners');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(statusInterval);
    };
  }, [deferredPrompt, showButton, isInstalled, installabilityStatus]);

  const handleInstallClick = async () => {
    console.log('[INSTALL] Usuario hizo clic en instalar');
    
    if (!deferredPrompt) {
      console.warn('[INSTALL] No hay prompt disponible');
      setInstallabilityStatus('Error: No hay prompt disponible');
      return;
    }

    try {
      console.log('[INSTALL] Mostrando prompt de instalación...');
      
      // Mostrar el prompt
      await deferredPrompt.prompt();
      
      console.log('[INSTALL] Prompt mostrado, esperando respuesta del usuario...');
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[INSTALL] Usuario respondió:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[INSTALL] Usuario aceptó la instalación');
        setInstallabilityStatus('Instalación aceptada');
      } else {
        console.log('[INSTALL] Usuario rechazó la instalación');
        setInstallabilityStatus('Instalación rechazada');
      }
      
      // Limpiar el prompt
      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('[INSTALL] Error durante la instalación:', error);
      setInstallabilityStatus(`Error: ${error}`);
    }
  };

  // No mostrar si ya está instalado o si no hay prompt disponible
  if (isInstalled || !showButton || !deferredPrompt) {
    return null;
  }

  return (
    <button
      className="install-pwa-button"
      onClick={handleInstallClick}
      title="Instalar HabitTrack como app"
      aria-label="Instalar aplicación"
    >
      <Download size={18} />
      <span>Instalar App</span>
    </button>
  );
}

