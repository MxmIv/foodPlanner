'use client';

import React from 'react';
import { Calendar, Users, Coffee, Moon, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMeals } from '../contexts/MealContext';

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
        saveMeals,
        previousWeek,
        nextWeek,
        goToCurrentWeek,
        formatDate,
        getDayName
    } = useMeals();

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
