import React from 'react';
import './KITAsyncSpinner.css';

export default function KITAsyncSpinner() {
  return (
    <div className="kit-async-spinner flex flex-col items-center justify-center">
      <div className="kit-logo-outline">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle
            className="kit-outline-anim"
            cx="20" cy="20" r="18"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="113"
            strokeDashoffset="0"
          />
          {/* Replace with your KIT logo SVG below if available */}
          <text x="50%" y="54%" textAnchor="middle" fill="#10B981" fontSize="18" fontWeight="bold" dy=".3em">KIT</text>
        </svg>
      </div>
      <div className="kit-dots mt-2">
        <span className="dot dot1"></span>
        <span className="dot dot2"></span>
        <span className="dot dot3"></span>
      </div>
    </div>
  );
}
