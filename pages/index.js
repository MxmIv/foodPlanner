// pages/index.js
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
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 flex flex-col">
            <Head>
                <title>Meal Planner</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header title="Meal Planner" />

            <main className="flex-1 container mx-auto px-4 py-6">
                <div className="mb-4 flex justify-end">
                    <Auth onAuthChange={({ session }) => setSession(session)} />
                </div>

                {session ? (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="h-full">
                            <MealPlanner userId={session.user.id} />
                        </div>
                        <div className="h-full max-h-[600px] overflow-y-auto">
                            <MealHistory userId={session.user.id} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        Please sign in to access your meal planner
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
