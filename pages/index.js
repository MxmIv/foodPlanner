// Update your index.js to correctly propagate authentication status

'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import MealPlanner from '@components/MealPlanner';
import MealHistory from "@components/MealHistory";
import Auth from '@components/Auth';
import Footer from "@components/Footer";
import Header from "@components/Header";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing Google auth on load
        const checkExistingAuth = () => {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('googleToken');
            const userEmail = localStorage.getItem('userEmail');

            if (userId && token) {
                console.log('Found existing auth in localStorage');
                setSession({
                    user: {
                        id: userId,
                        email: userEmail || 'user@example.com'
                    }
                });
                return true;
            }
            return false;
        };

        setIsLoading(true);

        // First check localStorage for existing auth
        const hasLocalAuth = checkExistingAuth();

        // Then check Supabase sessions only if no local auth found
        if (!hasLocalAuth) {
            supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
                if (supabaseSession) {
                    setSession(supabaseSession);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
            setSession(prev => supabaseSession || prev);
        });

        // Listen for storage events (in case localStorage changes in another tab)
        const handleStorageChange = (e) => {
            if (e.key === 'userId' || e.key === 'googleToken') {
                if (e.key === 'userId' && !e.newValue) {
                    // User logged out - clear session
                    setSession(null);
                } else {
                    // Re-check auth
                    checkExistingAuth();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleAuthChange = ({ isAuthenticated, userId, email }) => {
        if (isAuthenticated && userId) {
            // Store auth info in session state
            setSession({
                user: {
                    id: userId,
                    email: email
                }
            });
        } else {
            // Handle logout
            setSession(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 flex flex-col min-h-screen">
            <Head>
                <title>Meal Planner</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header title="Meal Planner" />

            <main className="flex-1 container mx-auto px-4 py-6">
                <div>
                    {/* Auth component - only render once */}
                    <div className="mb-4 flex justify-end">
                        <Auth onAuthChange={handleAuthChange}/>
                    </div>

                    {/* Pass userId to MealPlanner when available */}
                    {session ? (
                        <MealPlanner userId={session.user.id}/>
                    ) : (
                        <p className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-center">
                            Please sign in to access your meal planner
                        </p>
                    )}
                </div>
            </main>

            <Footer/>
        </div>
    );
}
