// contexts/MealContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mealService } from '../services/mealService';
import { googleCalendarService } from '../services/googleCalendarService';

// Create the context
const MealContext = createContext(null);

// Context provider component
export const MealProvider = ({ children }) => {
    const { userId, isAuthenticated } = useAuth();

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
    const [lastFetchedWeek, setLastFetchedWeek] = useState(null);

    // Helper function to get week dates
    function getWeekDates(offset = 0) {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() - 1) + (offset * 7));
        monday.setHours(0, 0, 0, 0);
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return date;
        });
    }

    // Check if Google API is ready
    useEffect(() => {
        const checkGoogleApiStatus = async () => {
            try {
                const isReady = await googleCalendarService.isApiReady();
                if (isReady) {
                    console.log('Google API is ready');
                    setIsGoogleApiReady(true);
                } else {
                    // If not available yet, check again in 500ms
                    setTimeout(checkGoogleApiStatus, 500);
                }
            } catch (err) {
                console.error('Error checking Google API status:', err);
                // Don't keep trying if there's an error
                setIsGoogleApiReady(false);
            }
        };

        if (isAuthenticated) {
            checkGoogleApiStatus();
        }

        // Listen for auth completion events
        const handleGoogleAuth = () => {
            console.log('Google Auth completed, API should be ready');
            checkGoogleApiStatus();
        };

        window.addEventListener('googleAuthComplete', handleGoogleAuth);

        return () => {
            window.removeEventListener('googleAuthComplete', handleGoogleAuth);
        };
    }, [isAuthenticated]);

    // Update week dates when offset changes
    useEffect(() => {
        setWeekDates(getWeekDates(currentWeekOffset));
        setLastFetchedWeek(null); // Reset to force new data fetch
    }, [currentWeekOffset]);

    // Load meals for the current week
    useEffect(() => {
        if (userId && isAuthenticated && weekDates.length > 0) {
            loadMealsForWeek();
        }
    }, [weekDates, userId, isAuthenticated]);

    // Load calendar events for the current week
    useEffect(() => {
        if (userId && isAuthenticated && weekDates.length > 0 && isGoogleApiReady) {
            loadEventsForWeek().catch(err => {
                console.error('Failed to load events:', err);
                // Don't set error state for auth issues to prevent UI disruption
                if (!err.message?.includes('No authentication token available')) {
                    setError(`Failed to load events: ${err.message}`);
                }
            });
        }
    }, [weekDates, userId, isAuthenticated, isGoogleApiReady]);

    // Auto-save meals when they change
    useEffect(() => {
        if (userId && isAuthenticated) {
            const timeoutId = setTimeout(() => {
                saveMeals();
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [meals, userId, isAuthenticated]);

    // Load meals for the current week
    const loadMealsForWeek = async () => {
        if (!userId || !isAuthenticated) return;

        // Check if we've already fetched for this week
        const weekKey = `${weekDates[0].toISOString()}_${weekDates[6].toISOString()}`;
        if (lastFetchedWeek === weekKey) {
            console.log('Skipping meal load - already fetched for this week');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const weekStart = weekDates[0];
            const weekEnd = weekDates[6];

            const result = await mealService.getMealsForWeek(
                userId,
                weekStart.toISOString().split('T')[0],
                weekEnd.toISOString().split('T')[0]
            );

            if (result.error) throw result.error;

            if (result.data && result.data.length > 0) {
                const freshMeals = {
                    lunch: Array(7).fill(''),
                    dinner: Array(7).fill('')
                };

                // Populate meals from database results
                result.data.forEach(meal => {
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

                setMeals(freshMeals);
            }

            setLastFetchedWeek(weekKey);
        } catch (err) {
            console.error('Error loading meals:', err);
            setError('Failed to load meals: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Load calendar events for the current week
    const loadEventsForWeek = async () => {
        if (!userId || !isAuthenticated) {
            return;
        }

        try {
            setIsLoading(true);
            // Only set error to null when starting a successful load
            setError(null);

            // Validate token availability first
            const token = localStorage.getItem('googleToken');
            if (!token) {
                console.log('No Google token available, skipping calendar load');
                // Don't set error for missing token to prevent UI disruption
                setEvents(Array(7).fill(null));
                setIsLoading(false);
                return;
            }

            const weekStart = new Date(weekDates[0]);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekDates[6]);
            weekEnd.setHours(23, 59, 59, 999);

            const result = await googleCalendarService.getEventsForRange(
                weekStart.toISOString(),
                weekEnd.toISOString()
            );

            if (result.error) {
                console.warn('Calendar API error:', result.error);
                // Don't throw auth errors to prevent UI disruption
                if (!result.error.includes('No authentication token available')) {
                    throw new Error(result.error);
                }
                setEvents(Array(7).fill(null));
                return;
            }

            const weekEvents = weekDates.map(date => {
                const dayEvents = result.items.filter(event => {
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
        } catch (err) {
            console.error('Error loading calendar events:', err);
            // Only set error state for non-auth errors to prevent UI disruption
            if (!err.message?.includes('No authentication token available')) {
                setError(`Failed to load calendar events: ${err.message}`);
            }
            setEvents(Array(7).fill(null));
            throw err; // Rethrow for the effect error handler
        } finally {
            setIsLoading(false);
        }
    };

    // Save meals to the server
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

            // Delete existing records and insert new ones
            const weekStart = weekDates[0].toISOString().split('T')[0];
            const weekEnd = weekDates[6].toISOString().split('T')[0];

            const result = await mealService.updateMealsForWeek(
                userId,
                weekStart,
                weekEnd,
                mealRecords
            );

            if (result.error) throw result.error;

            setSaveStatus('Saved successfully!');
            console.log('Save operation completed successfully');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            console.error('Error saving meals:', err);
            setError('Failed to save meals: ' + err.message);
            setSaveStatus('Failed to save');
        }
    };

    // Update a meal in the state
    const updateMeal = (mealType, dayIndex, value) => {
        setMeals(prev => ({
            ...prev,
            [mealType]: prev[mealType].map((meal, i) =>
                i === dayIndex ? value : meal
            )
        }));
    };

    // Week navigation functions
    const previousWeek = () => setCurrentWeekOffset(prev => prev - 1);
    const nextWeek = () => setCurrentWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    // Format functions
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    // Context value
    const contextValue = {
        currentWeekOffset,
        meals,
        weekDates,
        events,
        saveStatus,
        isLoading,
        error,
        isGoogleApiReady,
        updateMeal,
        saveMeals,
        previousWeek,
        nextWeek,
        goToCurrentWeek,
        formatDate,
        getDayName
    };

    return (
        <MealContext.Provider value={contextValue}>
            {children}
        </MealContext.Provider>
    );
};

// Custom hook to use the meal context
export const useMeals = () => {
    const context = useContext(MealContext);
    if (!context) {
        throw new Error('useMeals must be used within a MealProvider');
    }
    return context;
};
