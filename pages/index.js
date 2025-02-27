// pages/index.js
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import MealPlanner from '@components/MealPlanner';
import MealHistory from "@components/MealHistory";
import MealSuggestions from "@components/MealSuggestions";
import Footer from "@components/Footer";
import Header from "@components/Header";
import { Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { isLoading, isAuthenticated } = useAuth();

    // Add debug logging for tracking authentication state
    useEffect(() => {
        console.log('Authentication state:', { isAuthenticated, isLoading });
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-dark">Loading your meal planner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-neutral-light">
            <Head>
                <title>Meal Planner</title>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content="Plan your weekly meals and sync with your Google Calendar" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <Header title="Meal Planner" />

            <main className="flex-1 container mx-auto px-4 py-6">
                {isAuthenticated ? (
                    <div className="space-y-8">
                        {/* Meal Planner Section */}
                        <MealPlanner />

                        {/* Meal Suggestions Section */}
                        <MealSuggestions />

                        {/* Meal History Section */}
                        <MealHistory />
                    </div>
                ) : (
                    <div className="card text-center p-8 max-w-2xl mx-auto">
                        <div className="mb-6">
                            <Calendar className="h-16 w-16 text-primary mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Meal Planner</h2>
                            <p className="text-gray-600">
                                Plan your weekly meals and sync with your Google Calendar.
                            </p>
                        </div>

                        <div className="bg-primary-light bg-opacity-10 rounded-lg p-6 text-left">
                            <h3 className="font-semibold text-primary mb-2">To get started:</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>Sign in with your Google account using the button in the header</li>
                                <li>View and edit your weekly meal plan</li>
                                <li>Your meals will automatically sync with your Google Calendar</li>
                                <li>View your meal history and frequently used meals</li>
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};
