import { useState } from 'react';
import Head from 'next/head';
import MealPlanner from '@components/MealPlanner';
import MealHistory from "@components/MealHistory";
import Auth from '@components/Auth';

export default function Home() {
    const [userId, setUserId] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleAuthChange = ({ isAuthenticated, userId, email }) => {
        setIsAuthenticated(isAuthenticated);
        setUserId(userId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Meal Planner</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-4 flex justify-end">
                    <Auth onAuthChange={handleAuthChange} />
                </div>

                {isAuthenticated ? (
                    <div className="grid grid-cols-1 gap-8">
                        <div className="h-full">
                            <MealPlanner userId={userId} />
                        </div>
                        <div className="h-full max-h-[600px] overflow-y-auto">
                            <MealHistory userId={userId} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        Please sign in to access your meal planner
                    </div>
                )}
            </main>
        </div>
    );
}
