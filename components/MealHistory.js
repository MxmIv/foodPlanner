// components/MealHistory.js
"use client";

import React, { useState, useEffect } from 'react';
import { History, Utensils, Moon } from 'lucide-react';

const MealHistory = ({ userId }) => {
    const [mealHistory, setMealHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            loadMealHistory();
        }
    }, [userId]);

    const loadMealHistory = () => {
        try {
            // Ensure localStorage is available
            if (typeof window === 'undefined' || !window.localStorage) {
                throw new Error('localStorage is not available');
            }

            setIsLoading(true);
            setError(null);

            // Get all localStorage keys
            const keys = Object.keys(localStorage);
            const mealKeys = keys.filter(key => key.startsWith(`meals_${userId}_`));

            const history = [];
            mealKeys.forEach(key => {
                try {
                    const weekData = JSON.parse(localStorage.getItem(key));
                    const weekOffset = parseInt(key.split('_')[2]);

                    // Calculate the Monday date for this week
                    const mondayDate = getMondayDate(weekOffset);

                    // Add non-empty meals to history
                    weekData.lunch.forEach((meal, index) => {
                        if (meal) {
                            const date = new Date(mondayDate);
                            date.setDate(date.getDate() + index);
                            history.push({
                                date,
                                meal,
                                type: 'lunch'
                            });
                        }
                    });

                    weekData.dinner.forEach((meal, index) => {
                        if (meal) {
                            const date = new Date(mondayDate);
                            date.setDate(date.getDate() + index);
                            history.push({
                                date,
                                meal,
                                type: 'dinner'
                            });
                        }
                    });
                } catch (keyError) {
                    console.error(`Error processing key ${key}:`, keyError);
                }
            });

            // Sort by date, most recent first
            history.sort((a, b) => b.date - a.date);
            setMealHistory(history);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading meal history:', error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    const getMondayDate = (weekOffset) => {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() - 1) + (weekOffset * 7));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group meals by type
    const lunchMeals = mealHistory.filter(item => item.type === 'lunch');
    const dinnerMeals = mealHistory.filter(item => item.type === 'dinner');

    // Prevent excessive rendering if no userId
    if (!userId) return null;
    return (
        <div className="w-full bg-white rounded-lg shadow-lg">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <History className="h-6 w-6 text-gray-700" />
                    <h3 className="text-2xl font-bold text-gray-800">Meal History</h3>
                </div>

                {isLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading history...</div>
                ) : mealHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No meal history available</div>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        {/* Lunch Column */}
                        <div style={{ width: '48%' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Utensils className="h-5 w-5 text-green-600" />
                                <h4 className="text-xl font-semibold text-gray-700">Lunch History</h4>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Day</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Meal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {lunchMeals.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '8px' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                weekday: 'short'
                                            })}
                                        </td>
                                        <td style={{ padding: '8px' }}>{item.meal}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Dinner Column */}
                        <div style={{ width: '48%' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Moon className="h-5 w-5 text-indigo-600" />
                                <h4 className="text-xl font-semibold text-gray-700">Dinner History</h4>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Day</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Meal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dinnerMeals.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '8px' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                weekday: 'short'
                                            })}
                                        </td>
                                        <td style={{ padding: '8px' }}>{item.meal}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealHistory;
