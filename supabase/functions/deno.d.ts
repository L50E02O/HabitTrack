// Declaraciones de tipos para Deno en Edge Functions de Supabase
declare namespace Deno {
    export namespace env {
        export function get(key: string): string | undefined;
    }
}
