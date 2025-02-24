import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-white shadow-sm mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <p className="text-gray-600">© {new Date().getFullYear()} Meal Planner. All rights reserved.</p>
                    </div>
                    <div className="flex items-center">
                        <p className="text-sm text-gray-500">Built with Next.js</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
