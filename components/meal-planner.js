// components/MealPlanner.js
"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Coffee, Moon, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Auth from './Auth';

const MealPlanner = () => {
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [userId, setUserId] = useState(null);
    const [meals, setMeals] = useState({
        lunch: Array(7).fill(''),
        dinner: Array(7).fill('')
    });
    const [events, setEvents] = useState([]);
    const [saveStatus, setSaveStatus] = useState('');

    // Load meals for specific week
    const loadMealsForWeek = (weekOffset, currentUserId) => {
        if (!currentUserId) return;

        try {
            const weekKey = `meals_${currentUserId}_${weekOffset}`;
            const savedMeals = localStorage.getItem(weekKey);

            if (savedMeals) {
                try {
                    const parsedMeals = JSON.parse(savedMeals);
                    // Validate the structure of parsed meals
                    if (parsedMeals && parsedMeals.lunch && parsedMeals.dinner) {
                        setMeals(parsedMeals);
                    } else {
                        // If structure is invalid, reset to default
                        setMeals({
                            lunch: Array(7).fill(''),
                            dinner: Array(7).fill('')
                        });
                    }
                } catch (parseError) {
                    console.error('Error parsing meals:', parseError);
                    // Reset to default state if parsing fails
                    setMeals({
                        lunch: Array(7).fill(''),
                        dinner: Array(7).fill('')
                    });
                }
            } else {
                // Reset to default state if no saved meals
                setMeals({
                    lunch: Array(7).fill(''),
                    dinner: Array(7).fill('')
                });
            }
        } catch (error) {
            console.error('Error loading meals:', error);
            setMeals({
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            });
        }
    };

    // Get week dates based on offset
    const getWeekDates = (offset) => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff + (offset * 7)));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const [weekDates, setWeekDates] = useState(getWeekDates(0));

    // Handle auth state change
    const handleAuthChange = ({ isAuthenticated, userId: newUserId }) => {
        setUserId(newUserId);
        if (isAuthenticated && newUserId) {
            loadMealsForWeek(currentWeekOffset, newUserId);
        } else {
            // Reset state when logged out
            setMeals({
                lunch: Array(7).fill(''),
                dinner: Array(7).fill('')
            });
            setEvents([]);
        }
    };

    // Update week dates when offset changes
    useEffect(() => {
        setWeekDates(getWeekDates(currentWeekOffset));
        if (userId) {
            loadMealsForWeek(currentWeekOffset, userId);
        }
    }, [currentWeekOffset, userId]);

    // Save meals
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

    // Navigation functions
    const previousWeek = () => setCurrentWeekOffset(prev => prev - 1);
    const nextWeek = () => setCurrentWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get day name
    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    // Handle meal updates
    const updateMeal = (mealType, dayIndex, value) => {
        setMeals(prev => ({
            ...prev,
            [mealType]: prev[mealType].map((meal, i) =>
                i === dayIndex ? value : meal
            )
        }));
    };

    return (
        <div className="w-full max-w-6xl mx-auto my-8 bg-white rounded-lg shadow-lg">
            <div className="p-6">
                {/* Header with Auth */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">Weekly Meal Planner</h2>
                    </div>
                    <Auth onAuthChange={handleAuthChange} />
                </div>

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
                                    {events[index]?.title || '-'}
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
