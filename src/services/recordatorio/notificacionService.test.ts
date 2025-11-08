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

// Mock de Supabase
vi.mock("../../config/supabase", () => ({
    supabase: {
        from: vi.fn(),
    },
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
        it("debería enviar una notificación con título y cuerpo", () => {
            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "granted";

            enviarNotificacion("Recordatorio", "Es hora de hacer ejercicio");

            expect(mockNotification).toHaveBeenCalledWith("Recordatorio", {
                body: "Es hora de hacer ejercicio",
                icon: "/icon.png",
                badge: "/badge.png",
            });
        });

        it("no debería enviar notificación si no tiene permiso", () => {
            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "denied";

            enviarNotificacion("Recordatorio", "Mensaje");

            expect(mockNotification).not.toHaveBeenCalled();
        });

        it("debería incluir datos personalizados en la notificación", () => {
            const mockNotification = vi.fn();
            (globalThis as any).Notification = mockNotification as any;
            (globalThis as any).Notification.permission = "granted";

            enviarNotificacion("Hábito", "Completar tarea", {
                tag: "habito-123",
                requireInteraction: true,
            });

            expect(mockNotification).toHaveBeenCalledWith("Hábito", {
                body: "Completar tarea",
                icon: "/icon.png",
                badge: "/badge.png",
                tag: "habito-123",
                requireInteraction: true,
            });
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
        it("debería activarse si la hora actual coincide con intervalo_recordar", () => {
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: true,
                intervalo_recordar: "08:30:00",
            };

            // Mock de la hora actual: 08:30
            const horaActual = new Date();
            horaActual.setHours(8, 30, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);

            expect(debeActivarse).toBe(true);
        });

        it("no debería activarse si la hora no coincide", () => {
            const recordatorio = {
                id_recordatorio: "rec-1",
                id_perfil: "user-1",
                id_habito: "habito-1",
                mensaje: "Hacer ejercicio",
                activo: true,
                intervalo_recordar: "08:30:00",
            };

            // Mock de la hora actual: 09:00
            const horaActual = new Date();
            horaActual.setHours(9, 0, 0, 0);

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
                intervalo_recordar: "08:30:00",
            };

            const horaActual = new Date();
            horaActual.setHours(8, 30, 0, 0);

            const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);

            expect(debeActivarse).toBe(false);
        });
    });

    describe("Programar notificaciones diarias", () => {
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
    });
});