
import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
);

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => (
  <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <LoadingSpinner />
    <p className="mt-4 text-lg text-gray-200 font-semibold">{message}</p>
  </div>
);
