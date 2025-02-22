import Head from 'next/head';
import Header from '@components/Header';
import Footer from '@components/Footer';
import MealPlanner from './meal-planner';
import CalendarView from './CalendarView';

export default function Home() {
    return (
        <div className="container">
            <Head>
                <title>Meal Planner with Calendar</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <Header title="Welcome to My Meal Planner App!" />
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        marginTop: '2rem'
                    }}
                >
                    <div style={{ flex: '1 1 40%', minWidth: '300px', marginRight: '20px' }}>
                        <MealPlanner />
                    </div>
                    <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
                        <CalendarView />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
