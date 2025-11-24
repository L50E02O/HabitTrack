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
    console.log('📱 [INSTALL] Componente InstallPWAButton montado');
    
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      // Verificar si está en modo standalone (instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      const installed = isStandalone || isInWebAppiOS || isInWebAppChrome;
      
      console.log('📱 [INSTALL] Verificando si está instalado:', {
        isStandalone,
        isInWebAppiOS,
        isInWebAppChrome,
        installed,
        userAgent: navigator.userAgent
      });
      
      setIsInstalled(installed);
      
      if (installed) {
        console.log('📱 [INSTALL] ✅ La app ya está instalada');
        setInstallabilityStatus('Ya instalada');
        return;
      }
    };

    checkIfInstalled();

    // Verificar criterios de instalabilidad
    const checkInstallability = async () => {
      console.log('📱 [INSTALL] Verificando criterios de instalabilidad...');
      
      const checks = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        hasIcons: true, // Asumimos que los iconos están en el manifest
      };

      console.log('📱 [INSTALL] Criterios de instalabilidad:', checks);

      // Verificar manifest
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          const manifestUrl = manifestLink.href;
          console.log('📱 [INSTALL] Manifest URL:', manifestUrl);
          
          const response = await fetch(manifestUrl);
          if (response.ok) {
            const manifest = await response.json();
            console.log('📱 [INSTALL] Manifest cargado:', {
              name: manifest.name,
              short_name: manifest.short_name,
              icons: manifest.icons?.length || 0,
              start_url: manifest.start_url,
              display: manifest.display
            });
            
            // Verificar que los iconos sean válidos
            if (manifest.icons && manifest.icons.length > 0) {
              console.log('📱 [INSTALL] Iconos en manifest:', manifest.icons);
              for (const icon of manifest.icons) {
                try {
                  const iconResponse = await fetch(icon.src);
                  if (!iconResponse.ok) {
                    console.error(`📱 [INSTALL] ❌ Icono no accesible: ${icon.src} (${iconResponse.status})`);
                  } else {
                    console.log(`📱 [INSTALL] ✅ Icono accesible: ${icon.src}`);
                  }
                } catch (iconError) {
                  console.error(`📱 [INSTALL] ❌ Error verificando icono ${icon.src}:`, iconError);
                }
              }
            }
            
            checks.hasIcons = (manifest.icons?.length || 0) > 0;
          } else {
            console.error('📱 [INSTALL] ❌ Error cargando manifest:', response.status, response.statusText);
            // Intentar cargar manifest.json como fallback
            try {
              const fallbackResponse = await fetch('/manifest.json');
              if (fallbackResponse.ok) {
                const fallbackManifest = await fallbackResponse.json();
                console.log('📱 [INSTALL] ✅ Manifest fallback cargado:', fallbackManifest);
                checks.hasIcons = (fallbackManifest.icons?.length || 0) > 0;
              }
            } catch (fallbackError) {
              console.error('📱 [INSTALL] ❌ Error cargando manifest fallback:', fallbackError);
            }
          }
        } else {
          console.warn('📱 [INSTALL] ⚠️ No se encontró link al manifest en el HTML');
        }
      } catch (error) {
        console.error('📱 [INSTALL] ❌ Error verificando manifest:', error);
      }

      // Verificar Service Worker
      if (checks.hasServiceWorker) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('📱 [INSTALL] ✅ Service Worker listo:', registration.scope);
        } catch (error) {
          console.warn('📱 [INSTALL] ⚠️ Service Worker no listo:', error);
        }
      }

      const allChecksPass = Object.values(checks).every(check => check === true);
      console.log('📱 [INSTALL] Todos los criterios pasan:', allChecksPass, checks);
      
      if (!allChecksPass) {
        setInstallabilityStatus(`Faltan requisitos: ${Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k).join(', ')}`);
      } else {
        setInstallabilityStatus('Lista para instalar (esperando evento beforeinstallprompt)');
      }
    };

    checkInstallability();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 [INSTALL] 🎉 Evento beforeinstallprompt recibido!');
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowButton(true);
      setInstallabilityStatus('Lista para instalar - Botón disponible');
      
      console.log('📱 [INSTALL] Prompt guardado, botón mostrado');
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      console.log('📱 [INSTALL] ✅ App instalada exitosamente!');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      setInstallabilityStatus('Instalada');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log periódico del estado
    const statusInterval = setInterval(() => {
      console.log('📱 [INSTALL] Estado actual:', {
        showButton,
        isInstalled,
        hasDeferredPrompt: deferredPrompt !== null,
        status: installabilityStatus
      });
    }, 10000); // Cada 10 segundos

    return () => {
      console.log('📱 [INSTALL] Componente desmontado, limpiando listeners');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(statusInterval);
    };
  }, [deferredPrompt, showButton, isInstalled, installabilityStatus]);

  const handleInstallClick = async () => {
    console.log('📱 [INSTALL] Usuario hizo clic en instalar');
    
    if (!deferredPrompt) {
      console.warn('📱 [INSTALL] ⚠️ No hay prompt disponible');
      setInstallabilityStatus('Error: No hay prompt disponible');
      return;
    }

    try {
      console.log('📱 [INSTALL] Mostrando prompt de instalación...');
      
      // Mostrar el prompt
      await deferredPrompt.prompt();
      
      console.log('📱 [INSTALL] Prompt mostrado, esperando respuesta del usuario...');
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('📱 [INSTALL] Usuario respondió:', outcome);
      
      if (outcome === 'accepted') {
        console.log('📱 [INSTALL] ✅ Usuario aceptó la instalación');
        setInstallabilityStatus('Instalación aceptada');
      } else {
        console.log('📱 [INSTALL] ❌ Usuario rechazó la instalación');
        setInstallabilityStatus('Instalación rechazada');
      }
      
      // Limpiar el prompt
      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('📱 [INSTALL] ❌ Error durante la instalación:', error);
      setInstallabilityStatus(`Error: ${error}`);
    }
  };

  // No mostrar si ya está instalado
  if (isInstalled) {
    return null;
  }

  // Mostrar información de diagnóstico si no hay prompt disponible
  if (!showButton || !deferredPrompt) {
    return (
      <div className="install-pwa-info">
        <div className="install-pwa-status">
          <span className="status-icon">⏳</span>
          <div className="status-text">
            <div className="status-title">App lista para instalar</div>
            <div className="status-subtitle">
              {installabilityStatus.includes('esperando') 
                ? 'El navegador mostrará el botón de instalación automáticamente'
                : installabilityStatus}
            </div>
            <div className="status-hint">
              💡 También puedes instalar desde el menú del navegador (⋮ → Instalar aplicación)
            </div>
          </div>
        </div>
      </div>
    );
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

