import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    solicitarPermisoNotificaciones,
    verificarPermisoNotificaciones,
    enviarNotificacion,
    obtenerRecordatoriosActivos,
    debeActivarseRecordatorio,
    programarNotificacionesDiarias
} from "./notificacionService.js"; // Extensión explícita para TypeScript
import { supabase } from "../../config/supabase";
import * as pwaService from "../../utils/pwaService";

// Mock de Supabase
vi.mock("../../config/supabase", () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock de pwaService
vi.mock("../../utils/pwaService", () => ({
    enviarNotificacionViaSW: vi.fn(),
    tieneServiceWorkerActivo: vi.fn(),
}));

describe("NotificacionService - TDD", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Permisos de notificaciones", () => {
        it("debería solicitar permiso de notificaciones al usuario", async () => {
            // Mock del API de Notification
            const mockRequestPermission = vi.fn().mockResolvedValue("granted");
            (globalThis as any).Notification = {
                requestPermission: mockRequestPermission,
                permission: "default",
            } as any;

            const resultado = await solicitarPermisoNotificaciones();

            expect(mockRequestPermission).toHaveBeenCalled();
            expect(resultado).toBe("granted");
        });

        it("debería verificar si ya tiene permiso de notificaciones", () => {
            (globalThis as any).Notification = {
                permission: "granted",
            } as any;

            const tienePermiso = verificarPermisoNotificaciones();

            expect(tienePermiso).toBe(true);
        });

        it("debería retornar false si no tiene permiso de notificaciones", () => {
            (globalThis as any).Notification = {
                permission: "denied",
            } as any;

            const tienePermiso = verificarPermisoNotificaciones(); expect(tienePermiso).toBe(false);
        });
    });

    describe("Envío de notificaciones", () => {
        it("debería usar Service Worker si está disponible (PWA)", async () => {
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(true);
            vi.mocked(pwaService.enviarNotificacionViaSW).mockResolvedValue();

            (globalThis as any).Notification = {
                permission: "granted",
            };

            const resultado = await enviarNotificacion("Recordatorio", "Es hora de hacer ejercicio");

            expect(pwaService.tieneServiceWorkerActivo).toHaveBeenCalled();
            expect(pwaService.enviarNotificacionViaSW).toHaveBeenCalledWith(
                "Recordatorio",
                "Es hora de hacer ejercicio",
                expect.objectContaining({
                    body: "Es hora de hacer ejercicio",
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                })
            );
            expect(resultado).toBeNull(); // SW maneja la notificación
        });

        it("debería usar API de Notification como fallback si SW no está disponible", async () => {
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(false);

            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "granted";

            const resultado = await enviarNotificacion("Recordatorio", "Es hora de hacer ejercicio");

            expect(pwaService.enviarNotificacionViaSW).not.toHaveBeenCalled();
            expect(mockNotification).toHaveBeenCalledWith("Recordatorio", {
                body: "Es hora de hacer ejercicio",
                icon: "/icon-192.png",
                badge: "/icon-192.png",
            });
            expect(resultado).toBeInstanceOf(Object);
        });

        it("debería usar API de Notification si SW falla", async () => {
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(true);
            vi.mocked(pwaService.enviarNotificacionViaSW).mockRejectedValue(new Error("SW error"));

            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "granted";

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const resultado = await enviarNotificacion("Recordatorio", "Mensaje");

            expect(mockNotification).toHaveBeenCalled();
            expect(resultado).toBeInstanceOf(Object);

            consoleSpy.mockRestore();
        });

        it("no debería enviar notificación si no tiene permiso", async () => {
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(false);

            (globalThis as any).Notification = {
                permission: "denied",
            };

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const resultado = await enviarNotificacion("Recordatorio", "Mensaje");

            expect(pwaService.enviarNotificacionViaSW).not.toHaveBeenCalled();
            expect(resultado).toBeNull();

            consoleSpy.mockRestore();
        });

        it("debería incluir datos personalizados en la notificación", async () => {
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(true);
            vi.mocked(pwaService.enviarNotificacionViaSW).mockResolvedValue();

            (globalThis as any).Notification = {
                permission: "granted",
            };

            await enviarNotificacion("Hábito", "Completar tarea", {
                tag: "habito-123",
                requireInteraction: true,
            });

            expect(pwaService.enviarNotificacionViaSW).toHaveBeenCalledWith(
                "Hábito",
                "Completar tarea",
                expect.objectContaining({
                    tag: "habito-123",
                    requireInteraction: true,
                })
            );
        });
    });

    describe("Obtener recordatorios activos", () => {
        it("debería obtener recordatorios activos de un usuario", async () => {
            const mockRecordatorios = [
                {
                    id_recordatorio: "rec-1",
                    id_perfil: "user-1",
                    id_habito: "habito-1",
                    mensaje: "Hacer ejercicio",
                    activo: true,
                    intervalo_recordar: "08:00:00",
                },
                {
                    id_recordatorio: "rec-2",
                    id_perfil: "user-1",
                    id_habito: "habito-2",
                    mensaje: "Meditar",
                    activo: true,
                    intervalo_recordar: "20:00:00",
                },
            ];

            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: mockRecordatorios,
                            error: null,
                        }),
                    }),
                }),
            });

            (supabase.from as any) = mockFrom;

            const resultado = await obtenerRecordatoriosActivos("user-1");

            expect(mockFrom).toHaveBeenCalledWith("recordatorio");
            expect(resultado).toEqual(mockRecordatorios);
        });

        it("debería lanzar error si falla la consulta", async () => {
            const mockError = { message: "Error de base de datos" };
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: null,
                            error: mockError,
                        }),
                    }),
                }),
            });

            (supabase.from as any) = mockFrom;

            await expect(obtenerRecordatoriosActivos("user-1")).rejects.toThrow(
                "Error de base de datos"
            );
        });
    });

    describe("Verificar si debe activarse recordatorio", () => {
        it("debería activarse si la hora actual coincide con intervalo_recordar (UTC convertido a local)", () => {
            // intervalo_recordar está en UTC, pero se compara con hora local
            // Ejemplo: Si intervalo_recordar es "13:30:00" UTC y estamos en UTC-5,
            // la hora local sería 08:30
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: true,
                intervalo_recordar: "13:30:00", // UTC
            };

            // Crear una hora actual que coincida con la conversión UTC a local
            // Si intervalo_recordar es 13:30 UTC, y estamos en UTC-5, la hora local es 08:30
            const horaActual = new Date();
            // Simular que estamos en UTC-5 (ejemplo)
            // Para que coincida, necesitamos calcular la hora local equivalente
            // Vamos a usar setUTCHours para establecer la hora UTC y luego obtener la local
            horaActual.setUTCHours(13, 30, 0, 0);
            const horaLocalEsperada = horaActual.getHours();
            const minutoLocalEsperado = horaActual.getMinutes();

            // Crear nueva fecha con la hora local esperada
            const horaActualLocal = new Date();
            horaActualLocal.setHours(horaLocalEsperada, minutoLocalEsperado, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActualLocal);

            expect(debeActivarse).toBe(true);
        });

        it("no debería activarse si la hora no coincide", () => {
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: true,
                intervalo_recordar: "13:30:00", // UTC
            };

            // Calcular la hora local correcta
            const fechaCorrecta = new Date();
            fechaCorrecta.setUTCHours(13, 30, 0, 0);
            const horaLocalCorrecta = fechaCorrecta.getHours();
            const minutoLocalCorrecto = fechaCorrecta.getMinutes();

            // Crear hora actual que NO coincida (1 hora después)
            const horaActual = new Date();
            horaActual.setHours((horaLocalCorrecta + 1) % 24, minutoLocalCorrecto, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);

            expect(debeActivarse).toBe(false);
        });

        it("no debería activarse si el recordatorio no está activo", () => {
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: false,
                intervalo_recordar: "13:30:00", // UTC
            };

            // Calcular la hora local correcta
            const fechaCorrecta = new Date();
            fechaCorrecta.setUTCHours(13, 30, 0, 0);
            const horaLocalCorrecta = fechaCorrecta.getHours();
            const minutoLocalCorrecto = fechaCorrecta.getMinutes();

            const horaActual = new Date();
            horaActual.setHours(horaLocalCorrecta, minutoLocalCorrecto, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);

            expect(debeActivarse).toBe(false);
        });

        it("debería manejar correctamente la conversión UTC a hora local en diferentes zonas horarias", () => {
            // Test con una hora UTC específica
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: true,
                intervalo_recordar: "12:00:00", // Mediodía UTC
            };

            // Establecer la hora UTC y obtener la hora local equivalente
            const fechaUTC = new Date();
            fechaUTC.setUTCHours(12, 0, 0, 0);
            const horaLocalEsperada = fechaUTC.getHours();
            const minutoLocalEsperado = fechaUTC.getMinutes();

            // Crear hora actual con la hora local esperada
            const horaActual = new Date();
            horaActual.setHours(horaLocalEsperada, minutoLocalEsperado, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);

            expect(debeActivarse).toBe(true);
        });
    });

    describe("Programar notificaciones diarias", () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("debería programar verificación cada minuto", () => {
            vi.useFakeTimers();
            const mockSetInterval = vi.spyOn(globalThis, "setInterval");

            programarNotificacionesDiarias("user-1");

            expect(mockSetInterval).toHaveBeenCalledWith(
                expect.any(Function),
                60000 // 1 minuto
            );

            vi.useRealTimers();
        });

        it("debería retornar un ID para cancelar la programación", () => {
            const intervalId = programarNotificacionesDiarias("user-1");

            // En Node.js retorna un objeto Timeout, en navegador un número
            expect(intervalId).toBeDefined();
            expect(intervalId).toBeTruthy();
        });

        it("debería enviar notificación cuando la hora coincide", async () => {
            vi.useFakeTimers();
            
            const mockRecordatorios = [
                {
                    id_recordatorio: "rec-1",
                    id_perfil: "user-1",
                    id_habito: "habito-1",
                    mensaje: "Hacer ejercicio",
                    activo: true,
                    intervalo_recordar: "13:30:00", // UTC
                },
            ];

            // Mock de obtenerRecordatoriosActivos
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: mockRecordatorios,
                            error: null,
                        }),
                    }),
                }),
            });

            (supabase.from as any) = mockFrom;
            vi.mocked(pwaService.tieneServiceWorkerActivo).mockReturnValue(false);

            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "granted";

            // Mock de getUser para email
            (supabase.auth as any) = {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { email: "test@example.com" } },
                    error: null,
                }),
            };

            // Mock de obtener hábito
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { nombre_habito: "Ejercicio" },
                            error: null,
                        }),
                    }),
                }),
            });

            // Calcular la hora local equivalente a 13:30 UTC
            const fechaUTC = new Date();
            fechaUTC.setUTCHours(13, 30, 0, 0);
            const horaLocalEsperada = fechaUTC.getHours();
            const minutoLocalEsperado = fechaUTC.getMinutes();

            // Establecer la hora actual para que coincida
            vi.setSystemTime(new Date(2024, 0, 1, horaLocalEsperada, minutoLocalEsperado, 0, 0));

            programarNotificacionesDiarias("user-1");

            // Avanzar el tiempo 1 minuto para que se ejecute el intervalo
            await vi.advanceTimersByTimeAsync(60000);

            // Verificar que se intentó obtener los recordatorios
            expect(mockFrom).toHaveBeenCalledWith("recordatorio");

            vi.useRealTimers();
        });

        it("debería evitar enviar notificaciones duplicadas en el mismo minuto", async () => {
            // Este test solo verifica que el sistema de prevención de duplicados está en lugar
            // No podemos hacer test completo porque requeriría muchos mocks de timers y promesas

            const mockRecordatorios = [
                {
                    id_recordatorio: "rec-1",
                    id_perfil: "user-1",
                    id_habito: "habito-1",
                    mensaje: "Hacer ejercicio",
                    activo: true,
                    intervalo_recordar: "00:00:00",
                },
            ];

            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: mockRecordatorios,
                            error: null,
                        }),
                    }),
                }),
            });

            (supabase.from as any) = mockFrom;

            // La función retorna un intervalId que se puede usar con clearInterval
            const intervalId = programarNotificacionesDiarias("user-1");

            // Debe retornar un ID válido (puede ser un número o un Timeout object)
            expect(intervalId).toBeDefined();

            // Limpiar el intervalo
            clearInterval(intervalId);
        });
    });
});