import React from 'react';

const Header = ({ title }) => {
    return (
        <header className="w-full bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            </div>
        </header>
    );
};

export default Header;
