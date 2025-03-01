'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Coffee, Moon, ChevronLeft, ChevronRight, Save, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMeals } from '../contexts/MealContext';
import { createClient } from '@supabase/supabase-js';
import { googleCalendarService } from '../services/googleCalendarService';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MealPlanner = () => {
    const { isAuthenticated, userId } = useAuth();
    const {
        currentWeekOffset,
        meals,
        weekDates,
        events,
        saveStatus,
        isLoading,
        error,
        isGoogleApiReady,
        updateMeal,
        saveMeals: contextSaveMeals,
        previousWeek,
        nextWeek,
        goToCurrentWeek,
        formatDate,
        getDayName
    } = useMeals();

    const [showSaveNotification, setShowSaveNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    const [localEvents, setLocalEvents] = useState(events || Array(7).fill(null));
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    // Show notification when save status changes
    useEffect(() => {
        if (saveStatus) {
            setNotificationMessage(saveStatus);
            setNotificationType(saveStatus.includes('Failed') ? 'error' : 'success');
            setShowSaveNotification(true);

            // Auto hide notification after 3 seconds
            const timer = setTimeout(() => {
                setShowSaveNotification(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    // Update local events when context events change
    useEffect(() => {
        if (events) {
            setLocalEvents(events);
        }
    }, [events]);

    // Check if current week
    const isCurrentWeek = currentWeekOffset === 0;

    // Get current day index (0-6, Monday to Sunday)
    const getCurrentDayIndex = () => {
        const today = new Date().getDay() - 1; // Convert 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
        return today < 0 ? 6 : today; // Handle Sunday
    };

    // Check if a date is today
    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Format save notification
    const getSaveNotificationClasses = () => {
        return `notification ${notificationType === 'error' ? 'notification-error' : 'notification-success'} ${
            showSaveNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`;
    };

    // Manually load calendar events
    const refreshCalendarEvents = async () => {
        if (!isAuthenticated || !weekDates.length) {
            return;
        }

        try {
            setIsLoadingEvents(true);

            // Direct token access
            const token = localStorage.getItem('googleToken');
            if (!token) {
                console.log('No Google token available for calendar refresh');
                setNotificationMessage('Please login to access calendar events');
                setNotificationType('error');
                setShowSaveNotification(true);
                setTimeout(() => setShowSaveNotification(false), 3000);
                return;
            }

            // Make sure token is set in GAPI client
            if (window.gapi && window.gapi.client) {
                window.gapi.client.setToken({ access_token: token });
            }

            // Initialize calendar API if needed
            if (!window.gapi?.client?.calendar) {
                await googleCalendarService.initializeCalendarAPI();
            }

            // Calculate week boundaries
            const weekStart = new Date(weekDates[0]);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekDates[6]);
            weekEnd.setHours(23, 59, 59, 999);

            console.log('Manually refreshing calendar events');

            // Get events for the date range
            const result = await googleCalendarService.getEventsForRange(
                weekStart.toISOString(),
                weekEnd.toISOString()
            );

            if (result.error) {
                throw new Error(result.error);
            }

            // Process events for each day
            const updatedEvents = weekDates.map(date => {
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

            setLocalEvents(updatedEvents);
            setNotificationMessage('Calendar events refreshed');
            setNotificationType('success');
            setShowSaveNotification(true);
            setTimeout(() => setShowSaveNotification(false), 3000);
        } catch (error) {
            console.error('Error refreshing calendar events:', error);
            setNotificationMessage('Failed to refresh calendar events: ' + error.message);
            setNotificationType('error');
            setShowSaveNotification(true);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    // Local save meals implementation with consistent user ID
    const saveMeals = async () => {
        // Get the consistent user ID from Auth context
        const consistentUserId = userId;

        if (!consistentUserId || !isAuthenticated) {
            console.error('Cannot save meals: No user ID available');
            setNotificationMessage('Please login to save meals');
            setNotificationType('error');
            setShowSaveNotification(true);
            setTimeout(() => setShowSaveNotification(false), 3000);
            return;
        }

        try {
            console.log('Starting to save meals for user:', consistentUserId);
            setNotificationMessage('Saving...');
            setNotificationType('success');
            setShowSaveNotification(true);

            // Prepare meal records for the week
            const mealRecords = [];

            weekDates.forEach((date, index) => {
                const dateStr = date.toISOString().split('T')[0];

                // Add lunch record if there's a meal
                if (meals.lunch[index]) {
                    mealRecords.push({
                        user_id: consistentUserId, // Use the consistent ID
                        meal_date: dateStr,
                        meal_type: 'lunch',
                        meal_name: meals.lunch[index],
                        updated_at: new Date().toISOString()
                    });
                }

                // Add dinner record if there's a meal
                if (meals.dinner[index]) {
                    mealRecords.push({
                        user_id: consistentUserId, // Use the consistent ID
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

            console.log('Deleting existing records for date range:', weekStart, 'to', weekEnd);
            const { data: deleteData, error: deleteError } = await supabase
                .from('meal_plans')
                .delete()
                .eq('user_id', consistentUserId) // Use the consistent ID
                .gte('meal_date', weekStart)
                .lte('meal_date', weekEnd);

            if (deleteError) throw deleteError;

            console.log('Successfully deleted existing records');

            // Insert new records
            if (mealRecords.length > 0) {
                console.log('Inserting new meal records:', mealRecords);
                const { data: insertData, error: insertError } = await supabase
                    .from('meal_plans')
                    .insert(mealRecords);

                if (insertError) throw insertError;

                console.log('Successfully inserted new records:', insertData);
            } else {
                console.log('No meal records to insert');
            }

            setNotificationMessage('Saved successfully!');
            setNotificationType('success');
            console.log('Save operation completed successfully');
            setTimeout(() => setShowSaveNotification(false), 3000);
        } catch (error) {
            console.error('Error saving meals:', error);
            setNotificationMessage('Failed to save: ' + error.message);
            setNotificationType('error');
        }
    };

    return (
        <div className="card mb-8" id="meal-planner">
            {/* Header */}
            <div className="card-header-primary flex items-center gap-3">
                <Calendar className="h-6 w-6" />
                <h2 className="text-xl font-bold">Weekly Meal Planner</h2>
            </div>

            <div className="card-body">
                {!isAuthenticated && (
                    <div className="bg-amber-50 text-amber-700 p-4 mb-6 rounded-md border border-amber-200">
                        <p className="font-medium">You are not logged in</p>
                        <p className="text-sm mt-1">Please log in to save your meal plans.</p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 mb-6 rounded-md border border-red-200">
                        <p className="font-medium">Error</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                {/* Week Navigation and Controls */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={previousWeek}
                            className="btn btn-secondary flex items-center gap-1"
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <button
                            onClick={goToCurrentWeek}
                            className={`btn ${isCurrentWeek ? 'btn-accent' : 'btn-primary'}`}
                            disabled={isCurrentWeek}
                            aria-label="Current week"
                        >
                            This Week
                        </button>

                        <button
                            onClick={nextWeek}
                            className="btn btn-secondary flex items-center gap-1"
                            aria-label="Next week"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Calendar Refresh Button */}
                        {isAuthenticated && (
                            <button
                                onClick={refreshCalendarEvents}
                                className="btn btn-secondary flex items-center gap-2"
                                disabled={isLoadingEvents}
                                aria-label="Refresh calendar events"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh Events</span>
                            </button>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={saveMeals}
                            className="btn btn-primary flex items-center gap-2"
                            disabled={!isAuthenticated}
                            aria-label="Save meals"
                        >
                            <Save className="h-4 w-4" />
                            <span>Save Meals</span>
                        </button>
                    </div>
                </div>

                {/* Google API Status */}
                {!isGoogleApiReady && isAuthenticated && (
                    <div className="mb-6 p-3 bg-blue-50 text-blue-600 rounded-md border border-blue-200 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm">Initializing Google Calendar integration...</span>
                    </div>
                )}

                {/* Calendar Table */}
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="calendar-table">
                        <thead>
                        <tr>
                            <th className="min-w-[80px]"></th>
                            {weekDates.map((date, index) => (
                                <th
                                    key={index}
                                    className={`min-w-[120px] ${isToday(date) && isCurrentWeek ? 'bg-primary-light bg-opacity-10' : ''}`}
                                >
                                    <div className="calendar-day-header">
                                        <span className="calendar-day-name">{getDayName(date)}</span>
                                        <span className="calendar-day-date">{formatDate(date)}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span>Plans</span>
                                </div>
                            </td>
                            {weekDates.map((date, index) => (
                                <td
                                    key={index}
                                    className={`text-sm ${isToday(date) && isCurrentWeek ? 'bg-primary-light bg-opacity-5' : ''}`}
                                >
                                    {isLoading || isLoadingEvents ? (
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                        </div>
                                    ) : (
                                        <div className="max-h-12 overflow-y-auto">
                                            {localEvents[index]?.title ||
                                                <span className="text-gray-400">No events</span>
                                            }
                                        </div>
                                    )}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Coffee className="h-4 w-4 text-green-600" />
                                    <span>Lunch</span>
                                </div>
                            </td>
                            {weekDates.map((date, index) => (
                                <td
                                    key={index}
                                    className={isToday(date) && isCurrentWeek ? 'bg-primary-light bg-opacity-5' : ''}
                                >
                                    <input
                                        type="text"
                                        value={meals.lunch[index] || ''}
                                        onChange={(e) => updateMeal('lunch', index, e.target.value)}
                                        className="meal-input"
                                        placeholder="Add lunch..."
                                    />
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Moon className="h-4 w-4 text-indigo-600" />
                                    <span>Dinner</span>
                                </div>
                            </td>
                            {weekDates.map((date, index) => (
                                <td
                                    key={index}
                                    className={isToday(date) && isCurrentWeek ? 'bg-primary-light bg-opacity-5' : ''}
                                >
                                    <input
                                        type="text"
                                        value={meals.dinner[index] || ''}
                                        onChange={(e) => updateMeal('dinner', index, e.target.value)}
                                        className="meal-input"
                                        placeholder="Add dinner..."
                                    />
                                </td>
                            ))}
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Save Notification */}
            <div className={getSaveNotificationClasses()}>
                <div className="flex items-center">
                    {notificationType === 'success' ? (
                        <Check className="h-5 w-5 mr-2" />
                    ) : (
                        <X className="h-5 w-5 mr-2" />
                    )}
                    <span>{notificationMessage}</span>
                </div>
            </div>
        </div>
    );
};

export default MealPlanner;
