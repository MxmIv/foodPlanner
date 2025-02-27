'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Coffee, Moon, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lastFetchedWeek, setLastFetchedWeek] = useState(null);

    // Check if Google API is ready
    useEffect(() => {
        const checkGoogleApiStatus = () => {
            // Check if both gapi and google objects are available
            if (window.gapi && window.gapi.client && window.google) {
                console.log('Google API is ready');
                setIsGoogleApiReady(true);
            } else {
                // If not available yet, check again in 500ms
                setTimeout(checkGoogleApiStatus, 500);
            }
        };

        checkGoogleApiStatus();

        // Listen for auth completion events
        const handleGoogleAuth = () => {
            console.log('Google Auth completed, API should be ready');
            // Retry checking API status
            checkGoogleApiStatus();
        };

        window.addEventListener('googleAuthComplete', handleGoogleAuth);

        return () => {
            window.removeEventListener('googleAuthComplete', handleGoogleAuth);
        };
    }, []);

    useEffect(() => {
        // Check if user is authenticated based on userId and localStorage
        const checkAuthStatus = () => {
            const hasUserId = !!userId;
            const hasToken = !!localStorage.getItem('googleToken');

            console.log('Checking auth status:', { hasUserId, hasToken });

            // Only update auth state if it has changed to prevent re-renders
            const newAuthState = hasUserId && hasToken;
            if (isAuthenticated !== newAuthState) {
                setIsAuthenticated(newAuthState);
            }
        };

        checkAuthStatus();

        // Also listen for storage events (in case localStorage changes in another tab)
        const handleStorageChange = () => checkAuthStatus();
        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [userId, isAuthenticated]);

    const loadEventsForWeek = async () => {
        if (!userId || !isAuthenticated) {
            console.log('No user ID available');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('googleToken');
            if (!token) {
                console.log('No Google token available');
                setError('No Google token available. Please log in again.');
                setIsLoading(false);
                return;
            }

            const weekStart = new Date(weekDates[0]);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekDates[6]);
            weekEnd.setHours(23, 59, 59, 999);

            console.log('Fetching events for:', {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                token: token.substring(0, 10) + '...' // Log partial token for debugging
            });

            // Use fetch API with error handling
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: weekStart.toISOString(),
                    timeMax: weekEnd.toISOString(),
                    singleEvents: 'true',
                    orderBy: 'startTime'
                }),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Handle specific HTTP error codes
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('googleToken');
                throw new Error('Authentication token expired. Please log in again.');
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Calendar API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Events retrieved:', data.items.length);

            const weekEvents = weekDates.map(date => {
                const dayEvents = data.items.filter(event => {
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
            setError(`Failed to load calendar events: ${error.message}`);
            setEvents(Array(7).fill(null));
        } finally {
            setIsLoading(false);
        }
    };

    const loadMealsForWeek = async () => {
        if (!userId || !isAuthenticated) return;

        // Check if we've already fetched for this week to prevent unnecessary API calls
        const weekKey = `${weekDates[0].toISOString()}_${weekDates[6].toISOString()}`;
        if (lastFetchedWeek === weekKey) {
            console.log('Skipping meal load - already fetched for this week');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get start and end dates for the week
            const weekStart = weekDates[0];
            const weekEnd = weekDates[6];

            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .gte('meal_date', weekStart.toISOString().split('T')[0])
                .lte('meal_date', weekEnd.toISOString().split('T')[0])
                .order('meal_date', { ascending: true });

            if (error) throw error;

            // Initialize fresh meals structure
            const freshMeals = {
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            };

            // Populate meals from database results
            if (data && data.length > 0) {
                data.forEach(meal => {
                    const mealDate = new Date(meal.meal_date);
                    const dayIndex = weekDates.findIndex(date =>
                        date.getDate() === mealDate.getDate() &&
                        date.getMonth() === mealDate.getMonth() &&
                        date.getFullYear() === mealDate.getFullYear()
                    );

                    if (dayIndex !== -1) {
                        freshMeals[meal.meal_type][dayIndex] = meal.meal_name || '';
                    }
                });
            }

            setMeals(freshMeals);
            setLastFetchedWeek(weekKey);
        } catch (error) {
            console.error('Error loading meals:', error);
            setError('Failed to load meals: ' + error.message);
            // Don't clear existing meals on error
        } finally {
            setIsLoading(false);
        }
    };

    const saveMeals = async () => {
        if (!userId || !isAuthenticated) {
            console.error('Cannot save meals: No user ID available');
            setSaveStatus('Please login to save meals');
            return;
        }

        try {
            console.log('Starting to save meals for user:', userId);
            setSaveStatus('Saving...');
            setError(null);

            // Prepare meal records for the week
            const mealRecords = [];

            weekDates.forEach((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                console.log(`Processing meals for ${dateStr}:`, {
                    lunch: meals.lunch[index],
                    dinner: meals.dinner[index]
                });

                // Add lunch record if there's a meal
                if (meals.lunch[index]) {
                    mealRecords.push({
                        user_id: userId,
                        meal_date: dateStr,
                        meal_type: 'lunch',
                        meal_name: meals.lunch[index],
                        updated_at: new Date().toISOString()
                    });
                }

                // Add dinner record if there's a meal
                if (meals.dinner[index]) {
                    mealRecords.push({
                        user_id: userId,
                        meal_date: dateStr,
                        meal_type: 'dinner',
                        meal_name: meals.dinner[index],
                        updated_at: new Date().toISOString()
                    });
                }
            });

            console.log('Prepared meal records:', mealRecords.length);

            // Delete existing records for this week
            const weekStart = weekDates[0].toISOString().split('T')[0];
            const weekEnd = weekDates[6].toISOString().split('T')[0];

            console.log('Deleting existing records for date range:', weekStart, 'to', weekEnd);
            const { data: deleteData, error: deleteError } = await supabase
                .from('meal_plans')
                .delete()
                .eq('user_id', userId)
                .gte('meal_date', weekStart)
                .lte('meal_date', weekEnd);

            if (deleteError) {
                console.error('Error deleting existing meals:', deleteError);
                throw deleteError;
            }

            console.log('Successfully deleted existing records');

            // Insert new records
            if (mealRecords.length > 0) {
                console.log('Inserting new meal records:', mealRecords);
                const { data: insertData, error: insertError } = await supabase
                    .from('meal_plans')
                    .insert(mealRecords);

                if (insertError) {
                    console.error('Error inserting new meals:', insertError);
                    throw insertError;
                }

                console.log('Successfully inserted new records:', insertData);
            } else {
                console.log('No meal records to insert');
            }

            setSaveStatus('Saved successfully!');
            console.log('Save operation completed successfully');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Error saving meals:', error);
            setError('Failed to save meals: ' + error.message);
            setSaveStatus('Failed to save');
        }
    };

    useEffect(() => {
        setWeekDates(getWeekDates(currentWeekOffset));
        // Reset lastFetchedWeek when changing week
        setLastFetchedWeek(null);
    }, [currentWeekOffset]);

    // Split the meal loading and event loading into separate useEffects
    useEffect(() => {
        if (userId && isAuthenticated && weekDates.length > 0) {
            loadMealsForWeek();
        }
    }, [weekDates, userId, isAuthenticated]);

    // Separate useEffect for Google Calendar events to avoid unnecessary meal reloads
    useEffect(() => {
        if (userId && isAuthenticated && weekDates.length > 0 && isGoogleApiReady) {
            console.log('Loading calendar events - API is ready');
            loadEventsForWeek();
        }
    }, [weekDates, userId, isAuthenticated, isGoogleApiReady]);

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

    // Debounced auto-save with proper cleanup
    useEffect(() => {
        if (userId && isAuthenticated) {
            const timeoutId = setTimeout(() => {
                saveMeals();
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [meals, userId, isAuthenticated]);

    return (
        <div className="w-full bg-white rounded-lg shadow-lg">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">Weekly Meal Planner</h2>
                </div>

                {!isAuthenticated && (
                    <div className="bg-amber-50 text-amber-700 p-4 rounded-md mb-4">
                        You are not logged in. Please log in to save your meal plans.
                    </div>
                )}

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
                        disabled={!isAuthenticated}
                    >
                        <Save className="h-4 w-4" />
                        Save Meals
                    </button>
                </div>

                {/* Google API Status */}
                {!isGoogleApiReady && isAuthenticated && (
                    <div className="mb-4 text-amber-600 text-sm">
                        Waiting for Google Calendar API to initialize...
                    </div>
                )}

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
