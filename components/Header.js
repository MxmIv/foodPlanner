import React, { useState } from 'react';
import { Calendar, History, BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Auth from './Auth';

const Header = ({ title }) => {
    const { isAuthenticated } = useAuth();
    const [activeSection, setActiveSection] = useState('planner');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-10 w-full app-header shadow-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl app-header-title">{title}</h1>
                    </div>

                    {/* Desktop Navigation */}
                    {isAuthenticated && (
                        <nav className="hidden md:flex space-x-1 ml-6 mr-auto">
                            <button
                                onClick={() => scrollToSection('meal-planner')}
                                className={`app-header-nav-item ${
                                    activeSection === 'meal-planner' ? 'active' : ''
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Planner</span>
                                </span>
                            </button>

                            <button
                                onClick={() => scrollToSection('meal-suggestions')}
                                className={`app-header-nav-item ${
                                    activeSection === 'meal-suggestions' ? 'active' : ''
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>Frequent Meals</span>
                                </span>
                            </button>

                            <button
                                onClick={() => scrollToSection('meal-history')}
                                className={`app-header-nav-item ${
                                    activeSection === 'meal-history' ? 'active' : ''
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    <span>History</span>
                                </span>
                            </button>
                        </nav>
                    )}

                    {/* Auth component in header */}
                    <div className="ml-auto">
                        <Auth />
                    </div>

                    {/* Mobile menu button */}
                    {isAuthenticated && (
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden ml-4 p-2 rounded-full hover:bg-gray-100"
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6 text-gray-600" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-600" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile navigation drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 p-4">
                    <nav className="flex flex-col space-y-2">
                        <button
                            onClick={() => scrollToSection('meal-planner')}
                            className="px-4 py-2 rounded-md hover:bg-gray-100 text-left"
                        >
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Planner</span>
                            </span>
                        </button>

                        <button
                            onClick={() => scrollToSection('meal-suggestions')}
                            className="px-4 py-2 rounded-md hover:bg-gray-100 text-left"
                        >
                            <span className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>Frequent Meals</span>
                            </span>
                        </button>

                        <button
                            onClick={() => scrollToSection('meal-history')}
                            className="px-4 py-2 rounded-md hover:bg-gray-100 text-left"
                        >
                            <span className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                <span>History</span>
                            </span>
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
