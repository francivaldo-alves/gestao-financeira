import React from 'react';

export default function Toasts({ toasts }) {
  return (
    <div className="position-fixed top-0 end-0 p-3 z-3 d-flex flex-column gap-2" style={{ pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`d-flex align-items-center gap-3 px-4 py-2 rounded shadow-sm text-white small ${t.type === 'success' ? 'bg-success' : t.type === 'error' ? 'bg-danger' : 'bg-dark'
            }`}
          style={{ minWidth: 220, pointerEvents: 'auto' }}
        >
          <span className="flex-shrink-0">
            {t.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 00-1.414-1.414L8 11.166 4.71 7.876a1 1 0 10-1.414 1.415l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
              </svg>
            ) : t.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.455 9.695A1.75 1.75 0 0116.986 15H3.014a1.75 1.75 0 01-1.207-2.206L6.262 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 1116 0A8 8 0 012 10z" />
              </svg>
            )}
          </span>
          <div className="flex-grow-1">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
