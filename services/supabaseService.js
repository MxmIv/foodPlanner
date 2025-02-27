// services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabaseService = {
    // Get the current session
    getSession: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error getting Supabase session:', error);
            return null;
        }
    },

    // Subscribe to auth state changes
    subscribeToAuthChanges: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    },

    // Sign in with email and password
    signInWithEmail: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error signing in with email:', error);
            return { data: null, error };
        }
    },

    // Sign up with email and password
    signUpWithEmail: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error signing up with email:', error);
            return { data: null, error };
        }
    },

    // Sign out
    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error signing out:', error);
            return { error };
        }
    },

    // Get direct reference to Supabase client (use sparingly)
    getClient: () => supabase
};
