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

            const mockRegister = vi.fn().mockResolvedValue(mockRegistration);

            (globalThis as any).navigator = {
                serviceWorker: {
                    register: mockRegister,
                    controller: null,
                },
            };

            const resultado = await registrarServiceWorker();

            expect(mockRegister).toHaveBeenCalledWith('/sw.js', {
                scope: '/',
                type: 'module',
            });
            expect(resultado).toEqual(mockRegistration);
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

            const mockRegister = vi.fn().mockResolvedValue(mockRegistration);

            (globalThis as any).navigator = {
                serviceWorker: {
                    register: mockRegister,
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
            const mockActive = {
                postMessage: vi.fn(),
            };

            const mockRegistration = {
                ready: Promise.resolve({
                    active: mockActive,
                }),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: mockActive,
                    ready: Promise.resolve(mockRegistration),
                },
            };

            await enviarNotificacionViaSW('Título', 'Cuerpo', { tag: 'test' });

            expect(mockActive.postMessage).toHaveBeenCalledWith({
                type: 'SHOW_NOTIFICATION',
                title: 'Título',
                body: 'Cuerpo',
                options: expect.objectContaining({
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'test',
                    requireInteraction: false,
                }),
            });
        });

        it('debería usar valores por defecto si no se pasan opciones', async () => {
            const mockActive = {
                postMessage: vi.fn(),
            };

            const mockRegistration = {
                ready: Promise.resolve({
                    active: mockActive,
                }),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: mockActive,
                    ready: Promise.resolve(mockRegistration),
                },
            };

            await enviarNotificacionViaSW('Título', 'Cuerpo');

            expect(mockActive.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'SHOW_NOTIFICATION',
                    title: 'Título',
                    body: 'Cuerpo',
                })
            );
        });

        it('debería manejar errores silenciosamente cuando SW no está activo', async () => {
            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: null,
                },
            };

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await enviarNotificacionViaSW('Título', 'Cuerpo');

            expect(consoleSpy).toHaveBeenCalledWith(
                '[PWA] Service Worker no está activo, usando Notification API directamente'
            );

            consoleSpy.mockRestore();
        });

        it('debería manejar errores al enviar mensaje al SW', async () => {
            const mockActive = {
                postMessage: vi.fn(),
            };

            const mockRegistration = {
                ready: Promise.reject(new Error('SW error')),
            };

            (globalThis as any).navigator = {
                serviceWorker: {
                    controller: mockActive,
                    ready: mockRegistration,
                },
            };

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await enviarNotificacionViaSW('Título', 'Cuerpo');

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
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

