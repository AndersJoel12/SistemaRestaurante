// src/components/Notification.jsx

import React from 'react';

const Notification = ({ notification }) => {
    if (!notification) return null;

    const { type, message } = notification;

    const baseClass = "fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl text-white font-semibold transition-all duration-300 ease-in-out";
    let typeClass = "";

    switch (type) {
        case "success":
            typeClass = "bg-green-600";
            break;
        case "error":
            typeClass = "bg-red-600";
            break;
        case "warning":
            typeClass = "bg-yellow-600";
            break;
        default:
            typeClass = "bg-gray-600";
    }

    return (
        <div className={`${baseClass} ${typeClass}`}>
            {message}
        </div>
    );
};

export default Notification;