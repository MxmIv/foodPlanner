import React from 'react';
import { Calendar, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full app-footer shadow-inner mt-auto py-6">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Calendar className="h-6 w-6 mr-2 text-primary" />
                        <p className="text-lg font-semibold text-primary">Meal Planner</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-sm text-gray-600 mb-2">© {new Date().getFullYear()} Meal Planner. All rights reserved.</p>
                        <div className="flex items-center text-xs text-gray-500">
                            <span>Built with</span>
                            <Heart className="h-3 w-3 mx-1 text-red-400" fill="#fc8181" />
                            <span>using Next.js and Supabase</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
