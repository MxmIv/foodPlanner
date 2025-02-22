// pages/index.js
import Head from 'next/head'
import Header from '@components/Header'
import Footer from '@components/Footer'
import MealPlanner from './meal-planner'  // Adjust path if needed

export default function Home() {
    return (
        <div className="container">
            <Head>
                <title>Meal Planner with Google Calendar</title>
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
                    {/* Meal Planner Column */}
                    <div style={{ flex: '1 1 40%', minWidth: '300px', marginRight: '20px' }}>
                        <MealPlanner />
                    </div>

                    {/* Google Calendar Column */}
                    <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
                        <h2>My Google Calendar</h2>
                        <iframe
                            src="https://calendar.google.com/calendar/embed?src=your_google_calendar_id&ctz=America%2FNew_York"
                            style={{ border: 0, width: '100%', height: '600px' }}
                            frameBorder="0"
                            scrolling="no"
                        ></iframe>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
