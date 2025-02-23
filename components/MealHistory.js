// components/MealHistory.js
"use client";

import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';

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

    // Prevent excessive rendering if no userId
    if (!userId) return null;

    return (
        <div className="w-full bg-white rounded-lg shadow-lg">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5" />
                    <h3 className="text-xl font-semibold">Meal History</h3>
                </div>

                {isLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading history...</div>
                ) : mealHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No meal history available</div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mealHistory.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-white rounded shadow-sm border border-gray-100"
                                >
                                    <div className="text-sm text-gray-500">{formatDate(item.date)}</div>
                                    <div className="font-medium">{item.meal}</div>
                                    <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealHistory;
