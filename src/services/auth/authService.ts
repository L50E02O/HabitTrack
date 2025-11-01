import { supabase } from "../../config/supabase";

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options:{
      emailRedirectTo: "http://localhost:5173/login"
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export async function signOut(){
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
    return true;
}