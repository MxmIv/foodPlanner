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

                    // Explicitly initialize Calendar API
                    const calendarResult = await googleCalendarService.initializeCalendarAPI();
                    if (calendarResult && calendarResult.success) {
                        console.log('Calendar API initialized successfully');
                    } else if (calendarResult) {
                        console.warn('Calendar API initialization failed:', calendarResult.error);
                    }

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

    useEffect(() => {
        // First update weekDates
        const newWeekDates = getWeekDates(currentWeekOffset);
        setWeekDates(newWeekDates);

        // Reset meals to empty to prevent transferring data between weeks
        setMeals({
            lunch: Array(7).fill(''),
            dinner: Array(7).fill('')
        });

        // Reset lastFetchedWeek to force new data fetch
        setLastFetchedWeek(null);

        // Reset events when changing weeks
        setEvents(Array(7).fill(null));
    }, [currentWeekOffset]);

    useEffect(() => {
        if (userId && isAuthenticated && weekDates.length > 0) {
            loadMealsForWeek();
        }
    }, [weekDates, userId, isAuthenticated]);

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

    // Auto-save meals when they change with debouncing
    useEffect(() => {
        // Skip saving empty meals or when loading
        if (!userId || !isAuthenticated || isLoading) return;

        // Only save if there's actual meal data
        const hasMealData = meals.lunch.some(lunch => lunch !== '') ||
            meals.dinner.some(dinner => dinner !== '');

        if (hasMealData) {
            const timeoutId = setTimeout(() => {
                saveMeals();
            }, 10000);
            return () => clearTimeout(timeoutId);
        }
    }, [meals, userId, isAuthenticated, isLoading]);

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

            // Get consistent userId from context
            const consistentUserId = userId;

            const weekStart = weekDates[0];
            const weekEnd = weekDates[6];

            console.log(`Getting meals for ${consistentUserId} from ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);
            const result = await mealService.getMealsForWeek(
                consistentUserId,
                weekStart.toISOString().split('T')[0],
                weekEnd.toISOString().split('T')[0]
            );

            if (result.error) throw result.error;

            // Always create fresh meals array to avoid carrying over old data
            const freshMeals = {
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            };

            if (result.data && result.data.length > 0) {
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
            }

            // Set the meals with the fresh data
            setMeals(freshMeals);
            setLastFetchedWeek(weekKey);
        } catch (err) {
            console.error('Error loading meals:', err);
            setError('Failed to load meals: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Replace the loadEventsForWeek function in MealPlanner.js with this updated version

    const loadEventsForWeek = async () => {
        // Check both userId and isAuthenticated before proceeding
        if (!userId || !isAuthenticated) {
            console.log('No user ID available or user not authenticated - skipping calendar fetch');
            return; // Simply return without fetching or throwing errors
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('googleToken');
            if (!token) {
                console.log('No Google token available');
                setError('Please log in to see your calendar events');
                setIsLoading(false);
                return; // Return early without throwing
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
                // Token expired or invalid - handle gracefully without throwing
                console.log('Authentication token expired or invalid');
                localStorage.removeItem('googleToken'); // Clear invalid token
                setError('Authentication token expired. Please log in again.');
                setEvents(Array(7).fill(null)); // Clear events
                setIsLoading(false);
                return; // Return early without throwing
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(`Calendar API error: ${errorData.error?.message || response.statusText}`);
                setEvents(Array(7).fill(null));
                setIsLoading(false);
                return; // Return early without throwing
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

    // Save meals to the server
    const saveMeals = async () => {
        // Get consistent userId from context
        const consistentUserId = userId;

        if (!consistentUserId || !isAuthenticated) {
            console.error('Cannot save meals: No user ID available');
            setSaveStatus('Please login to save meals');
            return;
        }

        try {
            console.log('Starting to save meals for user:', consistentUserId);
            setSaveStatus('Saving...');
            setError(null);

            // Prepare meal records for the week
            const mealRecords = [];

            weekDates.forEach((date, index) => {
                const dateStr = date.toISOString().split('T')[0];

                // Add lunch record if there's a meal
                if (meals.lunch[index]) {
                    mealRecords.push({
                        user_id: consistentUserId, // Use consistent ID
                        meal_date: dateStr,
                        meal_type: 'lunch',
                        meal_name: meals.lunch[index],
                        updated_at: new Date().toISOString()
                    });
                }

                // Add dinner record if there's a meal
                if (meals.dinner[index]) {
                    mealRecords.push({
                        user_id: consistentUserId, // Use consistent ID
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
                consistentUserId, // Use consistent ID
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
