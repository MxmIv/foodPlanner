import { useState, useEffect } from 'react';
import { googleApi } from './google-api'; // Adjust path if you placed google-api.js elsewhere

const MealPlanner = () => {
    const [meal, setMeal] = useState('');
    const [mealEntries, setMealEntries] = useState([]);
    const [schedulingId, setSchedulingId] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [mealType, setMealType] = useState('Lunch');
    const [events, setEvents] = useState([]);
    const [isSignedIn, setIsSignedIn] = useState(false);

    // Initialize gapi and check for an existing token on mount
    useEffect(() => {
        googleApi
            .initGapi()
            .then(() => {
                if (
                    typeof window !== 'undefined' &&
                    window.gapi &&
                    window.gapi.client &&
                    window.gapi.client.getToken()
                ) {
                    setIsSignedIn(true);
                    googleApi.listUpcomingEvents().then(setEvents).catch((err) => console.error("Error listing events on init:", err));
                }
            })
            .catch((err) => console.error("Error initializing gapi:", err));
    }, []);

    const handleSignIn = async () => {
        try {
            await googleApi.handleAuthClick();
            setIsSignedIn(true);
            const upcomingEvents = await googleApi.listUpcomingEvents();
            setEvents(upcomingEvents);
        } catch (error) {
            console.error("Sign-in error:", error);
        }
    };

    const handleSignOut = () => {
        googleApi.handleSignoutClick();
        setIsSignedIn(false);
        setEvents([]);
    };

    // Load stored meal entries from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedMeals = localStorage.getItem('mealEntries');
            if (storedMeals) {
                setMealEntries(JSON.parse(storedMeals));
            }
        }
    }, []);

    // Update localStorage whenever mealEntries changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mealEntries', JSON.stringify(mealEntries));
        }
    }, [mealEntries]);

    const handleAddMeal = (e) => {
        e.preventDefault();
        if (meal.trim() === '') return;
        const newEntry = {
            id: Date.now(),
            meal: meal.trim(),
            createdAt: new Date().toISOString(),
            schedule: null,
        };
        setMealEntries([...mealEntries, newEntry]);
        setMeal('');
    };

    const startScheduling = (id) => {
        setSchedulingId(id);
        setScheduleDate('');
        setMealType('Lunch');
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduleDate) return;

        try {
            // Update the local meal entry with schedule info
            setMealEntries((prevEntries) =>
                prevEntries.map((entry) =>
                    entry.id === schedulingId
                        ? { ...entry, schedule: { date: scheduleDate, mealType } }
                        : entry
                )
            );

            // Find the meal entry to be scheduled
            const scheduledMeal = mealEntries.find(
                (entry) => entry.id === schedulingId
            );
            if (!scheduledMeal) {
                throw new Error("Meal not found for scheduling.");
            }

            // Build the event object to pass to the API
            const eventObject = {
                summary: `Meal: ${scheduledMeal.meal}`,
                description: `Meal Type: ${mealType}`,
                start: { date: scheduleDate },
                end: { date: scheduleDate },
            };

            // Create the event in Google Calendar
            await googleApi.createCalendarEvent(eventObject);

            setSchedulingId(null);
            setScheduleDate('');
            setMealType('Lunch');
            alert("Meal scheduled and added to Google Calendar!");
            const updatedEvents = await googleApi.listUpcomingEvents();
            setEvents(updatedEvents);
        } catch (error) {
            console.error("Error scheduling meal or adding to calendar:", error);
            alert("Error scheduling meal. Please check the console for details.");
        }
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Meal Planner</h2>
            <form onSubmit={handleAddMeal}>
                <input
                    type="text"
                    placeholder="Enter full dish name (e.g., chicken with potato)"
                    value={meal}
                    onChange={(e) => setMeal(e.target.value)}
                    style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                    Add Meal
                </button>
            </form>

            <h3 style={{ marginTop: '1rem' }}>Meal Entries:</h3>
            <ul>
                {mealEntries.map((entry) => (
                    <li key={entry.id} style={{ marginBottom: '1rem' }}>
                        <div>
                            <strong>{entry.meal}</strong>
                            {entry.schedule ? (
                                <span>
                  {' '}
                                    - Scheduled on {new Date(entry.schedule.date).toLocaleDateString()} for{' '}
                                    {entry.schedule.mealType}
                </span>
                            ) : (
                                <span> - Not scheduled</span>
                            )}
                        </div>
                        {!entry.schedule && (
                            <button onClick={() => startScheduling(entry.id)} style={{ marginTop: '0.5rem' }}>
                                Schedule Meal
                            </button>
                        )}
                        {schedulingId === entry.id && (
                            <form onSubmit={handleScheduleSubmit} style={{ marginTop: '0.5rem' }}>
                                <div>
                                    <label>
                                        Date:{' '}
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            required
                                        />
                                    </label>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label>
                                        Meal Type:{' '}
                                        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                                            <option value="Lunch">Lunch</option>
                                            <option value="Dinner">Dinner</option>
                                        </select>
                                    </label>
                                </div>
                                <button type="submit" style={{ marginTop: '0.5rem' }}>
                                    Confirm Scheduling
                                </button>
                            </form>
                        )}
                    </li>
                ))}
            </ul>

            {isSignedIn ? (
                <div>
                    <button onClick={handleSignOut}>Sign Out</button>
                    <h3>Upcoming Events:</h3>
                    <ul>
                        {events.map((event) => (
                            <li key={event.id}>{event.summary}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <button onClick={handleSignIn}>Sign In with Google</button>
            )}
        </div>
    );
};

export default MealPlanner;
