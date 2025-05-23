"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export class GoogleService {
  private static instance: GoogleService;
  private supabase = createClientComponentClient();

  private constructor() {}

  static getInstance(): GoogleService {
    if (!GoogleService.instance) {
      GoogleService.instance = new GoogleService();
    }
    return GoogleService.instance;
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }
} 
