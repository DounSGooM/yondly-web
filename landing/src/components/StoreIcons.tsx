import React from 'react';

export const AppleLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 384 512"
        className={className}
        fill="currentColor"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
    </svg>
);

export const GooglePlayLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 512 512"
        className={className}
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path fill="#4285F4" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
        <path fill="#34A853" d="M47.4 45.4v421.2L287.4 273.2 47.4 45.4z" />
        <path fill="#FBBC04" d="M433.4 263.6L104.6 499l220.7-220.7 108.1 63.6c28.2 16.5 28.2 43.5 0 60.1z" />
        <path fill="#EA4335" d="M104.6 499l280.8-305.6L325.3 263.6 104.6 499z" />
        {/* Fallback monochromatic path if needed, but colorful is better for "Real logo" */}
    </svg>
);
