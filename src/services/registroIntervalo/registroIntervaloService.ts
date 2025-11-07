import { supabase } from "../../config/supabase";
import type { IRegistroIntervalo, CreateIRegistroIntervalo, UpdateIRegistroIntervalo } from "../../types/IRegistroIntervalo";

export async function createRegistroIntervalo(nuevoRegistro: CreateIRegistroIntervalo): Promise<IRegistroIntervalo>{
    const { data, error} = await supabase
    .from("registro_intervalo")
    .insert(nuevoRegistro)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllRegistrosIntervalo(): Promise<IRegistroIntervalo[]>{
    const { data, error } = await supabase
    .from("registro_intervalo")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getRegistroIntervaloById(id: string): Promise<IRegistroIntervalo>{
    const { data, error } =  await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_registro", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updateRegistroIntervalo(id: string, registro: UpdateIRegistroIntervalo): Promise<void>{
    const { error } = await supabase
    .from("registro_intervalo")
    .update(registro)
    .eq("id_registro", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deleteRegistroIntervalo(id: string): Promise<void>{
    const { error } = await supabase
    .from("registro_intervalo")
    .delete()
    .eq("id_registro", id);

    if(error){
        throw new Error(error.message);
    }
}
