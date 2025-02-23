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

    // Group meals by type
    const lunchMeals = mealHistory.filter(item => item.type === 'lunch');
    const dinnerMeals = mealHistory.filter(item => item.type === 'dinner');

    // Prevent excessive rendering if no userId
    if (!userId) return null;

    return (
        <div className="w-full bg-white rounded-lg shadow-md">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <History className="h-7 w-7 text-gray-700" />
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
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Date</th>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Day</th>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Meal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {lunchMeals.map((item, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            ':hover': { backgroundColor: '#f9fafb' }
                                        }}
                                    >
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                weekday: 'short'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#111827' }}>
                                            {item.meal}
                                        </td>
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
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Date</th>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Day</th>
                                    <th style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: '#6b7280'
                                    }}>Meal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dinnerMeals.map((item, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            ':hover': { backgroundColor: '#f9fafb' }
                                        }}
                                    >
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                weekday: 'short'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '0.875rem', color: '#111827' }}>
                                            {item.meal}
                                        </td>
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
