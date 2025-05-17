'use client';

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClientComponentClient, Session, User as SupabaseAuthUser } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { User } from "@/hooks/useAuth";

// Define route types
const PROTECTED_ROUTE_PREFIXES = ['/admin', '/employee', '/dashboard'] as const; // '/dashboard' might be generic
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'] as const;
// PUBLIC_ROUTES are not strictly needed for redirection logic if default is allow.

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  signUp: (userData: {
    email: string;
    password: string;
    full_name: string;
    role: "admin" | "employee"; // Keep this for the signUp function's intent
    // Add other fields required for profile creation during signup
    department?: string; // Made optional, provide defaults if needed
    phone?: string;    // Made optional
  }) => Promise<{ error?: any; data?: any }>; // Return data or error for better handling
  signOut: () => Promise<void>;
  completeOAuthProfile: (profileData: Partial<User>) => Promise<{ error?: any; data?: any }>; // For new OAuth users
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const fetchUserProfile = useCallback(async (authUser: SupabaseAuthUser | null): Promise<User | null> => {
    if (!authUser) return null;
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error.message);
        return null;
      }

      if (!profileData) {
        console.warn("No profile found for user:", authUser.id);
        // Optionally create profile here if needed
        return null;
      }

      return profileData as User;
    } catch (e) {
      console.error("Unexpected error fetching profile:", e);
      return null;
    }
  }, [supabase]);
  
  const handleAuthRedirects = useCallback((currentUser: User | null, currentPath: string) => {
    const isAuthRoute = AUTH_ROUTES.some(route => currentPath.startsWith(route));
    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => currentPath.startsWith(prefix));

    if (currentUser) {
      if (isAuthRoute) {
        // User is logged in and on an auth page, redirect to their dashboard
        if (currentUser.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/employee/dashboard");
        }
      } else if (currentPath.startsWith("/admin") && currentUser.role !== "admin") {
        toast.error("Access Denied: Admin access only");
        router.push("/employee/dashboard");
      } else if (currentPath.startsWith("/employee") && currentUser.role !== "employee") {
        toast.error("Access Denied: Employee access only");
        router.push("/admin/dashboard");
      }
    } else { // No user
      if (isProtectedRoute) {
        toast.info("Please log in to access this page");
        router.push(`/login?redirectedFrom=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [router]);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoading(true);
        setSession(newSession);
        const authUser = newSession?.user ?? null;
        
        if (authUser) {
          const userProfile = await fetchUserProfile(authUser);
          if (userProfile) {
            setUser(userProfile);
            handleAuthRedirects(userProfile, pathname);
          } else {
            // User is in auth.users but not profiles table
            // This can happen for a new OAuth user or if profile creation failed during signup
            setUser(null); 
            // For email/pass users, if profile is missing after sign-in/up, it's an issue.
            // Might redirect to login with error or a generic error page.
            // For now, treat as logged out for redirection purposes if profile crucial.
            handleAuthRedirects(null, pathname);
          }
        } else { // No session, user logged out
          setUser(null);
          handleAuthRedirects(null, pathname);
        }
        setLoading(false);
      }
    );

    // Initial check in case onAuthStateChange doesn't fire immediately with existing session
    // This can be useful after a page refresh.
    const initialSessionCheck = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const authUser = currentSession?.user ?? null;
      if (authUser) {
        const userProfile = await fetchUserProfile(authUser);
        if (userProfile) {
          setUser(userProfile);
          handleAuthRedirects(userProfile, pathname);
        } else {
           setUser(null);
           // Potentially an OAuth user whose profile wasn't created or linked.
           handleAuthRedirects(null, pathname);
        }
      } else {
        setUser(null);
        handleAuthRedirects(null, pathname);
      }
      setLoading(false);
    };
    
    // Only run initial check if subscription hasn't already set a user or session,
    // or to handle the very first load. This logic might need refinement to avoid races.
    // A simpler approach is to let onAuthStateChange be the sole driver, as it usually
    // fires with the current session state on load.
    // For now, keeping a simplified initial check.
    if (!session && !user) { // Avoid re-running if onAuthStateChange already populated
        initialSessionCheck();
    }


    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, fetchUserProfile, handleAuthRedirects, supabase.auth, router, session, user]); // Added session, user to dep array

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message || "Sign in failed.");
        throw error;
      }

      // Check if email is verified
      if (!data.user?.email_confirmed_at) {
        // Sign out the user since we don't want unverified users to be logged in
        await supabase.auth.signOut();
        
        // Send another verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });

        if (resendError) {
          toast.error("Failed to resend verification email. Please try again later.");
        } else {
          toast.info("Please verify your email before logging in. A new verification email has been sent.");
        }

        throw new Error("Please verify your email before logging in.");
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Error loading user profile");
        throw profileError;
      }

      if (!profile) {
        toast.error("User profile not found. Please contact support.");
        throw new Error("Profile not found");
      }

      // onAuthStateChange will handle fetching profile and redirecting
    } catch (error: any) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message || "Google sign in failed.");
        throw error;
      }

      // The actual profile creation will happen in the OAuth callback
      // through the Supabase trigger function
      return { data, error: null };
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: "admin" | "employee";
    department?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes("security purposes")) {
          const seconds = authError.message.match(/(\d+) seconds/)?.[1] || "60";
          toast.error(`Please wait ${seconds} seconds before trying again`);
        } else {
          toast.error(authError.message || "Sign up failed");
        }
        return { error: authError };
      }

      if (!authData.user) {
        const error = new Error("User creation failed");
        toast.error(error.message);
        return { error };
      }

      // Let the database trigger handle profile creation
      // We'll wait a moment to allow the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if profile was created by trigger
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error checking profile:", profileError);
        // Don't try to create profile manually - let the trigger handle it
        toast.success("Account created! Please check your email to verify your account before logging in.");
        return { data: null };
      }

      toast.success("Account created! Please check your email to verify your account before logging in.");
      return { data: profile };
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      toast.error("An unexpected error occurred");
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const completeOAuthProfile = async (profileData: Partial<User>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile with any new data
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating profile:", updateError);
          toast.error("Failed to update profile");
          return { error: updateError };
        }

        return { data: updatedProfile };
      }

      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: profileData.full_name || user.user_metadata?.full_name || "",
          role: profileData.role || "employee", // Default to employee for OAuth users
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        toast.error("Failed to create profile");
        return { error: insertError };
      }

      toast.success("Profile completed successfully!");
      return { data: newProfile };
    } catch (error) {
      console.error("Error completing OAuth profile:", error);
      toast.error("Failed to complete profile setup");
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message || "Sign out failed.");
        throw error;
      }
      // onAuthStateChange will handle the rest
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        completeOAuthProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 
