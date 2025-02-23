import React, { useState, useEffect } from 'react';
import { Calendar, Users, Coffee, Moon, ChevronLeft, ChevronRight, Save } from 'lucide-react';

const MealPlanner = ({ userId }) => {
    const getWeekDates = (offset = 0) => {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() - 1) + (offset * 7));
        monday.setHours(0, 0, 0, 0);
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return date;
        });
    };

    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [meals, setMeals] = useState({
        lunch: Array(7).fill(''),
        dinner: Array(7).fill('')
    });
    const [weekDates, setWeekDates] = useState(getWeekDates(0));
    const [events, setEvents] = useState(Array(7).fill(null));
    const [saveStatus, setSaveStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadEventsForWeek = async () => {
        if (!userId || !window.gapi?.client) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const weekStart = new Date(weekDates[0]);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekDates[6]);
            weekEnd.setHours(23, 59, 59, 999);

            console.log('Fetching events for:', {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString()
            });

            const token = window.gapi.client.getToken();
            if (!token) {
                throw new Error('No valid token available');
            }

            const response = await window.gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: weekStart.toISOString(),
                timeMax: weekEnd.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            const weekEvents = weekDates.map(date => {
                const dayEvents = response.result.items.filter(event => {
                    const eventStart = new Date(event.start.dateTime || event.start.date);
                    return (
                        eventStart.getDate() === date.getDate() &&
                        eventStart.getMonth() === date.getMonth() &&
                        eventStart.getFullYear() === date.getFullYear()
                    );
                });

                return dayEvents.length > 0
                    ? {
                        title: dayEvents.map(e => e.summary || 'Untitled Event').join(', '),
                        events: dayEvents
                    }
                    : null;
            });

            setEvents(weekEvents);
        } catch (error) {
            console.error('Error loading calendar events:', error);
            setError('Failed to load calendar events. Please ensure you are logged in.');
            setEvents(Array(7).fill(null));
        } finally {
            setIsLoading(false);
        }
    };

    const loadMealsForWeek = () => {
        if (!userId) return;

        try {
            const weekKey = `meals_${userId}_${currentWeekOffset}`;
            const savedMeals = localStorage.getItem(weekKey);

            const freshMeals = {
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            };

            if (savedMeals) {
                const parsedMeals = JSON.parse(savedMeals);
                if (parsedMeals?.lunch) {
                    parsedMeals.lunch.forEach((meal, index) => {
                        if (index < 7) freshMeals.lunch[index] = meal || '';
                    });
                }
                if (parsedMeals?.dinner) {
                    parsedMeals.dinner.forEach((meal, index) => {
                        if (index < 7) freshMeals.dinner[index] = meal || '';
                    });
                }
            }

            setMeals(freshMeals);
        } catch (error) {
            console.error('Error loading meals:', error);
            setMeals({
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            });
        }
    };

    useEffect(() => {
        setWeekDates(getWeekDates(currentWeekOffset));
    }, [currentWeekOffset]);

    useEffect(() => {
        if (userId) {
            loadMealsForWeek();
            // Add a small delay to ensure Google API is fully initialized
            const loadEventsTimer = setTimeout(() => {
                loadEventsForWeek();
            }, 1000);
            return () => clearTimeout(loadEventsTimer);
        }
    }, [weekDates, userId]);

    const saveMeals = () => {
        if (!userId) {
            setSaveStatus('Please login to save meals');
            return;
        }

        try {
            const weekKey = `meals_${userId}_${currentWeekOffset}`;
            localStorage.setItem(weekKey, JSON.stringify(meals));
            setSaveStatus('Saved successfully!');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Error saving meals:', error);
            setSaveStatus('Failed to save meals');
        }
    };

    const previousWeek = () => setCurrentWeekOffset(prev => prev - 1);
    const nextWeek = () => setCurrentWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const updateMeal = (mealType, dayIndex, value) => {
        setMeals(prev => ({
            ...prev,
            [mealType]: prev[mealType].map((meal, i) =>
                i === dayIndex ? value : meal
            )
        }));
    };

    useEffect(() => {
        if (userId) {
            const timeoutId = setTimeout(() => {
                saveMeals();
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [meals, userId, currentWeekOffset]);

    return (
        <div className="w-full bg-white rounded-lg shadow-lg">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">Weekly Meal Planner</h2>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {/* Week Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={previousWeek}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Week
                    </button>

                    <button
                        onClick={goToCurrentWeek}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Current Week
                    </button>

                    <button
                        onClick={nextWeek}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Next Week
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Save Button and Status */}
                <div className="flex justify-end items-center gap-4 mb-4">
                    {saveStatus && (
                        <span className={`text-sm ${saveStatus.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                            {saveStatus}
                        </span>
                    )}
                    <button
                        onClick={saveMeals}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        <Save className="h-4 w-4" />
                        Save Meals
                    </button>
                </div>

                {/* Calendar Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr>
                            <th className="p-2 border-b">Date</th>
                            {weekDates.map((date, index) => (
                                <th key={index} className="p-2 border-b text-center">
                                    <div>{getDayName(date)}</div>
                                    <div className="text-sm text-gray-500">{formatDate(date)}</div>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="p-2 border-b flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Plans
                            </td>
                            {weekDates.map((_, index) => (
                                <td key={index} className="p-2 border-b text-center">
                                    {isLoading ? (
                                        <span className="text-gray-400">Loading...</span>
                                    ) : (
                                        events[index]?.title || '-'
                                    )}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-2 border-b flex items-center gap-2">
                                <Coffee className="h-4 w-4" />
                                Lunch
                            </td>
                            {weekDates.map((_, index) => (
                                <td key={index} className="p-2 border-b">
                                    <input
                                        type="text"
                                        value={meals.lunch[index] || ''}
                                        onChange={(e) => updateMeal('lunch', index, e.target.value)}
                                        className="w-full p-1 border rounded"
                                        placeholder="Add meal..."
                                    />
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-2 border-b flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                Dinner
                            </td>
                            {weekDates.map((_, index) => (
                                <td key={index} className="p-2 border-b">
                                    <input
                                        type="text"
                                        value={meals.dinner[index] || ''}
                                        onChange={(e) => updateMeal('dinner', index, e.target.value)}
                                        className="w-full p-1 border rounded"
                                        placeholder="Add meal..."
                                    />
                                </td>
                            ))}
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MealPlanner;
