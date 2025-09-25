"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const credentials = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
      },
    },
  });
  
  if (error) {
    return { status: error.message, user: null };
  } else if (data?.user?.identities?.length === 0) {
    // User exists but needs to confirm their email
    return { status: "confirm", user: null };
  }

  revalidatePath("/");
  return { status: "success", user: data.user };
}

export async function logIn(formData: FormData) {
  //console.log("Logging in with formData:", formData);
  const supabase = await createClient()
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    console.error("Login error:", error);
    return { status: error.message, user: null };
  }

  revalidatePath("/");
  return { status: "success", user: data.user };
}

export async function logOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { status: error.message };
  }
  revalidatePath("/");
  return { status: "success" };
}