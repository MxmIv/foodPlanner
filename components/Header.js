import React, { useState } from 'react';
import { Calendar, History, BookOpen, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ title }) => {
    const { isAuthenticated } = useAuth();
    const [activeSection, setActiveSection] = useState('planner');

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    return (
        <header className="sticky top-0 z-10 w-full bg-primary text-white shadow-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">{title}</h1>
                    </div>

                    {isAuthenticated && (
                        <nav className="hidden md:flex space-x-1">
                            <button
                                onClick={() => scrollToSection('meal-planner')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    activeSection === 'meal-planner'
                                        ? 'bg-white text-primary font-medium'
                                        : 'hover:bg-primary-light'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Planner</span>
                                </span>
                            </button>

                            <button
                                onClick={() => scrollToSection('meal-suggestions')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    activeSection === 'meal-suggestions'
                                        ? 'bg-white text-primary font-medium'
                                        : 'hover:bg-primary-light'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>Suggestions</span>
                                </span>
                            </button>

                            <button
                                onClick={() => scrollToSection('meal-history')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    activeSection === 'meal-history'
                                        ? 'bg-white text-primary font-medium'
                                        : 'hover:bg-primary-light'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    <span>History</span>
                                </span>
                            </button>
                        </nav>
                    )}

                    {/* Mobile menu button for smaller screens */}
                    <div className="md:hidden">
                        <button className="p-2 rounded hover:bg-primary-light">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile navigation drawer (hidden by default) */}
            <div className="md:hidden hidden bg-primary-dark p-4">
                <nav className="flex flex-col space-y-2">
                    <button
                        onClick={() => scrollToSection('meal-planner')}
                        className="px-4 py-2 rounded-md hover:bg-primary-light"
                    >
                        <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Planner</span>
                        </span>
                    </button>

                    <button
                        onClick={() => scrollToSection('meal-suggestions')}
                        className="px-4 py-2 rounded-md hover:bg-primary-light"
                    >
                        <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Suggestions</span>
                        </span>
                    </button>

                    <button
                        onClick={() => scrollToSection('meal-history')}
                        className="px-4 py-2 rounded-md hover:bg-primary-light"
                    >
                        <span className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <span>History</span>
                        </span>
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default Header;
