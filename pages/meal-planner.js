// meal-planner.js
import { useState, useEffect } from 'react';
import { googleApi } from './google-api';

const MealPlanner = ({ setIsSignedIn }) => {
    const [meal, setMeal] = useState('');
    const [mealEntries, setMealEntries] = useState([]);
    const [schedulingId, setSchedulingId] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [mealType, setMealType] = useState('Lunch');
    const [userInfo, setUserInfo] = useState(null);

    // Load meal entries from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedMeals = localStorage.getItem('mealEntries');
            if (storedMeals) {
                setMealEntries(JSON.parse(storedMeals));
            }
        }
    }, []);

    // Save meal entries to localStorage when updated
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mealEntries', JSON.stringify(mealEntries));
        }
    }, [mealEntries]);

    const handleAddMeal = (e) => {
        e.preventDefault();
        if (!meal.trim()) return;
        const newEntry = {
            id: Date.now(),
            meal: meal.trim(),
            createdAt: new Date().toISOString(),
            schedule: null,
        };
        setMealEntries([...mealEntries, newEntry]);
        setMeal('');
        console.log("Added meal:", newEntry);
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
            // Update local meal entry with schedule info
            setMealEntries((prevEntries) =>
                prevEntries.map((entry) =>
                    entry.id === schedulingId
                        ? { ...entry, schedule: { date: scheduleDate, mealType } }
                        : entry
                )
            );

            const scheduledMeal = mealEntries.find(
                (entry) => entry.id === schedulingId
            );
            if (!scheduledMeal) {
                throw new Error("Meal not found for scheduling.");
            }

            // For an all-day event, end date is the next day.
            const startDate = scheduleDate;
            const endDateObj = new Date(scheduleDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            const endDate = endDateObj.toISOString().split('T')[0];

            const eventObject = {
                summary: `Meal: ${scheduledMeal.meal}`,
                description: `Meal Type: ${mealType}`,
                start: { date: startDate },
                end: { date: endDate },
            };

            console.log("Creating event with object:", eventObject);
            const createdEvent = await googleApi.createCalendarEvent(eventObject);
            console.log("Created event:", createdEvent);

            setSchedulingId(null);
            setScheduleDate('');
            setMealType('Lunch');
            alert("Meal scheduled and added to Google Calendar!");
        } catch (error) {
            console.error("Error scheduling meal or adding to calendar:", error);
            alert("Error scheduling meal. Check console for details.");
        }
    };

    const handleSignIn = async () => {
        try {
            const tokenResponse = await googleApi.handleAuthClick();
            console.log("Sign in successful. Token response:", tokenResponse);
            setIsSignedIn(true);
            const info = await googleApi.getUserInfo();
            setUserInfo(info);
            console.log("User info:", info);
        } catch (error) {
            console.error("Sign in error:", error);
        }
    };

    const handleSignOut = () => {
        googleApi.handleSignoutClick();
        setIsSignedIn(false);
        setUserInfo(null);
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Meal Planner</h2>
            {userInfo && (
                <p style={{ fontWeight: 'bold' }}>Logged in as: {userInfo.name}</p>
            )}
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
                                    - Scheduled on {new Date(entry.schedule.date).toLocaleDateString()} for {entry.schedule.mealType}
                </span>
                            ) : (
                                <span> - Not scheduled</span>
                            )}
                        </div>
                        {!entry.schedule && (
                            <button
                                onClick={() => startScheduling(entry.id)}
                                style={{ marginTop: '0.5rem' }}
                            >
                                Schedule Meal
                            </button>
                        )}
                        {schedulingId === entry.id && (
                            <form
                                onSubmit={handleScheduleSubmit}
                                style={{ marginTop: '0.5rem' }}
                            >
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
                                        <select
                                            value={mealType}
                                            onChange={(e) => setMealType(e.target.value)}
                                        >
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
            <div style={{ marginTop: '1rem' }}>
                {userInfo ? (
                    <button onClick={handleSignOut}>Sign Out</button>
                ) : (
                    <button onClick={handleSignIn}>Sign In with Google</button>
                )}
            </div>
        </div>
    );
};

export default MealPlanner;
