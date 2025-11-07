import { supabase } from "../../config/supabase";
import type { ILogroUsuario, CreateILogroUsuario, UpdateILogroUsuario } from "../../types/ILogroUsuario";

export async function createLogroUsuario(nuevoLogroUsuario: CreateILogroUsuario): Promise<ILogroUsuario>{
    const { data, error} = await supabase
    .from("logro_usuario")
    .insert(nuevoLogroUsuario)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllLogrosUsuario(): Promise<ILogroUsuario[]>{
    const { data, error } = await supabase
    .from("logro_usuario")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getLogroUsuarioById(id: string): Promise<ILogroUsuario>{
    const { data, error } =  await supabase
    .from("logro_usuario")
    .select("*")
    .eq("id_logro_usuario", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updateLogroUsuario(id: string, logroUsuario: UpdateILogroUsuario): Promise<void>{
    const { error } = await supabase
    .from("logro_usuario")
    .update(logroUsuario)
    .eq("id_logro_usuario", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deleteLogroUsuario(id: string): Promise<void>{
    const { error } = await supabase
    .from("logro_usuario")
    .delete()
    .eq("id_logro_usuario", id);

    if(error){
        throw new Error(error.message);
    }
}
