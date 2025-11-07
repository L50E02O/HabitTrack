import { supabase } from "../../config/supabase";
import type { IPerfil, UpdateIPerfil }  from "../../types/IPerfil";

export async function createPerfil(nuevoPerfil: IPerfil): Promise<IPerfil>{
    const { data, error} = await supabase
    .from("perfil")
    .insert(nuevoPerfil)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllPerfils(): Promise<IPerfil[]>{
    const { data, error } = await supabase
    .from("perfil")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getPerfilById(id: string): Promise<IPerfil>{
    const { data, error } =  await supabase
    .from("perfil")
    .select("*")
    .eq("id", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updatePerfil(id: string, perfil: UpdateIPerfil): Promise<void>{
    const { error } = await supabase
    .from("perfil")
    .update(perfil)
    .eq("id", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deletePerfil(id: string): Promise<void>{
    const { error } = await supabase
    .from("perfil")
    .delete()
    .eq("id", id);

    if(error){
        throw new Error(error.message);
    }
}