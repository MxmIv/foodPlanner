// services/userService.js - Fixed version
import { supabaseService } from './supabaseService';

// Get the client from the service
const supabase = supabaseService.getClient();

export const userService = {
    // Find or create a user by email
    findOrCreateUser: async (email, googleId) => {
        try {
            console.log('Finding or creating user:', { email, googleId });

            // First check if user exists with this email
            const { data: existingUser, error: findError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (findError && findError.code !== 'PGRST116') { // Not found error
                throw findError;
            }

            // If user exists, update the Google ID if it's different
            if (existingUser) {
                console.log('User found:', existingUser);

                // Update Google ID if it changed
                if (existingUser.google_id !== googleId) {
                    console.log('Updating Google ID for existing user');
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({
                            google_id: googleId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingUser.id);

                    if (updateError) throw updateError;
                }

                return {
                    user: existingUser,
                    error: null
                };
            }

            // User doesn't exist, create new user
            console.log('Creating new user');
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    email: email,
                    google_id: googleId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);

                // If the error is related to RLS policy, try a simpler insert
                if (createError.code === '42501') {
                    console.log('RLS policy error - trying simplified insert without timestamps');

                    const { data: simpleUser, error: simpleError } = await supabase
                        .from('users')
                        .insert([{
                            email: email,
                            google_id: googleId
                        }])
                        .select()
                        .single();

                    if (simpleError) throw simpleError;

                    return {
                        user: simpleUser,
                        error: null
                    };
                }

                throw createError;
            }

            console.log('New user created:', newUser);
            return {
                user: newUser,
                error: null
            };
        } catch (error) {
            console.error('Error in findOrCreateUser:', error);
            return {
                user: null,
                error
            };
        }
    },

    // Get user by Google ID
    getUserByGoogleId: async (googleId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('google_id', googleId)
                .single();

            if (error) throw error;
            return { user: data, error: null };
        } catch (error) {
            console.error('Error getting user by Google ID:', error);
            return { user: null, error };
        }
    },

    // Get user by email
    getUserByEmail: async (email) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { user: data, error: null };
        } catch (error) {
            console.error('Error getting user by email:', error);
            return { user: null, error };
        }
    }
};
