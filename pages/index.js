// index.js
import Head from 'next/head';
import Header from '@components/Header';
import Footer from '@components/Footer';
import MealPlanner from './meal-planner';
import CalendarView from './CalendarView';
import { useState } from 'react';

export default function Home() {
    const [isSignedIn, setIsSignedIn] = useState(false);

    return (
        <div style={{ margin: 0, padding: 0, width: '100%', boxSizing: 'border-box' }}>
            <Head>
                <title>Meal Planner with Calendar</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header title="Welcome to My Meal Planner App!" />

            <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {/* Left Column: Meal Planner */}
                    <div style={{ flex: '1 1 50%', minWidth: '300px', padding: '0.5rem' }}>
                        <MealPlanner setIsSignedIn={setIsSignedIn} />
                    </div>
                    {/* Right Column: Calendar */}
                    <div style={{ flex: '1 1 50%', minWidth: '300px', padding: '0.5rem' }}>
                        <CalendarView isSignedIn={isSignedIn} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
