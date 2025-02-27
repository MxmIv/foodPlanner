// pages/index.js
'use client';

import { useState } from 'react';
import Head from 'next/head';
import MealPlanner from '@components/MealPlanner';
import MealHistory from "@components/MealHistory";
import Auth from '@components/Auth';
import Footer from "@components/Footer";
import Header from "@components/Header";
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { session, isLoading, user, isAuthenticated } = useAuth();

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
                        <Auth />
                    </div>

                    {/* Pass userId to MealPlanner when available */}
                    {isAuthenticated ? (
                        <MealPlanner />
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
