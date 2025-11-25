import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    registrarServiceWorker,
    tieneServiceWorkerActivo,
    enviarNotificacionViaSW,
    solicitarPermisoPush,
    tienePermisoNotificaciones,
} from './pwaService';

describe('pwaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Limpiar mocks de navigator
        delete (globalThis as any).navigator;
        delete (globalThis as any).Notification;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('registrarServiceWorker', () => {
        it('debería registrar el Service Worker si está disponible', async () => {
            const mockRegistration = {
                scope: '/',
                installing: null,
                waiting: null,
                active: {
                    postMessage: vi.fn(),
                },
                addEventListener: vi.fn(),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    ready: Promise.resolve(mockRegistration),
                    controller: null,
                },
            };

            const resultado = await registrarServiceWorker();

            expect(resultado).toEqual(mockRegistration);
            expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
                'updatefound',
                expect.any(Function)
            );
        });

        it('debería retornar null si Service Worker no está soportado', async () => {
            (globalThis as any).navigator = {};

            const resultado = await registrarServiceWorker();

            expect(resultado).toBeNull();
        });

        it('debería manejar errores al registrar', async () => {
            const mockRegister = vi.fn().mockRejectedValue(new Error('Error de registro'));

            (globalThis as any).navigator = {
                serviceWorker: {
                    register: mockRegister,
                    controller: null,
                },
            };

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const resultado = await registrarServiceWorker();

            expect(resultado).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('debería escuchar eventos de actualización', async () => {
            const mockInstalling = {
                state: 'installed',
                addEventListener: vi.fn(),
            };

            const mockRegistration = {
                scope: '/',
                installing: mockInstalling,
                waiting: null,
                active: {
                    postMessage: vi.fn(),
                },
                addEventListener: vi.fn((event, handler) => {
                    if (event === 'updatefound') {
                        handler();
                    }
                }),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    ready: Promise.resolve(mockRegistration),
                    controller: {
                        postMessage: vi.fn(),
                    },
                },
            };

            await registrarServiceWorker();

            expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
                'updatefound',
                expect.any(Function)
            );
        });
    });

    describe('tieneServiceWorkerActivo', () => {
        it('debería retornar true si Service Worker está activo', () => {
            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: {
                        postMessage: vi.fn(),
                    },
                },
            };

            const resultado = tieneServiceWorkerActivo();

            expect(resultado).toBe(true);
        });

        it('debería retornar false si Service Worker no está activo', () => {
            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: null,
                },
            };

            const resultado = tieneServiceWorkerActivo();

            expect(resultado).toBe(false);
        });

        it('debería retornar false si Service Worker no está soportado', () => {
            (globalThis as any).navigator = {};

            const resultado = tieneServiceWorkerActivo();

            expect(resultado).toBe(false);
        });
    });

    describe('enviarNotificacionViaSW', () => {
        it('debería enviar notificación a través del Service Worker', async () => {
            const mockRegistration = {
                scope: '/',
                showNotification: vi.fn().mockResolvedValue(undefined),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: {},
                    ready: Promise.resolve(mockRegistration),
                },
            };

            // Mock Notification como constructor
            const mockNotificationConstructor = vi.fn();
            (globalThis as any).Notification = mockNotificationConstructor as any;
            (globalThis as any).Notification.permission = 'granted';

            await enviarNotificacionViaSW('Test', 'Mensaje de prueba');

            expect(mockRegistration.showNotification).toHaveBeenCalledWith(
                'Test',
                expect.objectContaining({
                    body: 'Mensaje de prueba',
                    icon: '/icon-192.png',
                })
            );
        });

        it('debería usar valores por defecto si no se pasan opciones', async () => {
            const mockRegistration = {
                scope: '/',
                showNotification: vi.fn().mockResolvedValue(undefined),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: {},
                    ready: Promise.resolve(mockRegistration),
                },
            };

            // Mock Notification como constructor
            const mockNotificationConstructor = vi.fn();
            (globalThis as any).Notification = mockNotificationConstructor as any;
            (globalThis as any).Notification.permission = 'granted';

            await enviarNotificacionViaSW('Test', 'Mensaje');

            expect(mockRegistration.showNotification).toHaveBeenCalledWith(
                'Test',
                expect.objectContaining({
                    body: 'Mensaje',
                    icon: '/icon-192.png',
                    badge: '/badge.png',
                })
            );
        });

        it('debería manejar errores silenciosamente cuando SW no está activo', async () => {
            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: null,
                },
            };

            // Mock Notification como constructor
            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = 'granted';

            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await enviarNotificacionViaSW('Título', 'Cuerpo');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[PWA] Usando Notification API directamente'
            );

            consoleLogSpy.mockRestore();
        });

        it('debería manejar errores al enviar mensaje al SW', async () => {
            const mockActive = {
                postMessage: vi.fn(() => {
                    throw new Error('PostMessage error');
                }),
            };

            const mockRegistration = {
                active: mockActive,
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: mockActive,
                    ready: Promise.resolve(mockRegistration),
                },
            };

            // Mock Notification como constructor
            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = 'granted';

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await enviarNotificacionViaSW('Título', 'Cuerpo');

            // Debe loguear que hay error con SW
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[PWA] Error con Service Worker'),
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });
    });

    describe('solicitarPermisoPush', () => {
        it('debería retornar granted si ya tiene permiso', async () => {
            (globalThis as any).Notification = {
                permission: 'granted',
            };

            const resultado = await solicitarPermisoPush();

            expect(resultado).toBe('granted');
        });

        it('debería solicitar permiso si es default', async () => {
            const mockRequestPermission = vi.fn().mockResolvedValue('granted');

            (globalThis as any).Notification = {
                permission: 'default',
                requestPermission: mockRequestPermission,
            };

            const resultado = await solicitarPermisoPush();

            expect(mockRequestPermission).toHaveBeenCalled();
            expect(resultado).toBe('granted');
        });

        it('debería retornar denied si el permiso fue denegado', async () => {
            (globalThis as any).Notification = {
                permission: 'denied',
            };

            const resultado = await solicitarPermisoPush();

            expect(resultado).toBe('denied');
        });

        it('debería lanzar error si Notification no está disponible', async () => {
            delete (globalThis as any).Notification;

            await expect(solicitarPermisoPush()).rejects.toThrow(
                'Este navegador no soporta notificaciones'
            );
        });
    });

    describe('tienePermisoNotificaciones', () => {
        it('debería retornar true si tiene permiso granted', () => {
            (globalThis as any).Notification = {
                permission: 'granted',
            };

            const resultado = tienePermisoNotificaciones();

            expect(resultado).toBe(true);
        });

        it('debería retornar false si no tiene permiso', () => {
            (globalThis as any).Notification = {
                permission: 'denied',
            };

            const resultado = tienePermisoNotificaciones();

            expect(resultado).toBe(false);
        });

        it('debería retornar false si Notification no está disponible', () => {
            delete (globalThis as any).Notification;

            const resultado = tienePermisoNotificaciones();

            expect(resultado).toBe(false);
        });
    });
});

