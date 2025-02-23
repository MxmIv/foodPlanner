// pages/index.js
import Head from 'next/head';
import MealPlanner from '../components/meal-planner';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Meal Planner</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto px-4 py-8">
                <MealPlanner />
            </main>
        </div>
    );
}
