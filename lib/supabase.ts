import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const authHelpers = {
    // Sign up with email and password
    signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    },

    // Sign in with email and password
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    // Sign out
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Reset password
    resetPassword: async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        return { data, error };
    },

    // Update password
    updatePassword: async (newPassword: string) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        return { data, error };
    },

    // Get current user
    getCurrentUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Alias for getCurrentUser
    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Get session
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        return { session, error };
    },
};
