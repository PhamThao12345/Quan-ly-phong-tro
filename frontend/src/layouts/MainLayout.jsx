import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
    return (
        <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen font-['Inter']">
            {/* Sidebar cố định bên trái */}
            <Sidebar />

            {/* Nội dung bên phải */}
            <div className="ml-64">
                <Header />
                <main className="mt-16 p-8 min-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
