
import React from 'react';
import { DownloadIcon, TrashIcon } from './Icons';

interface ImagePreviewCardProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  onDownload?: () => void;
  children?: React.ReactNode;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({ src, alt, onRemove, onDownload, children }) => {
  return (
    <div className="relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      <div 
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" x="0" y="0" fill="%23374151" /><rect width="10" height="10" x="10" y="10" fill="%23374151" /><rect width="10" height="10" x="10" y="0" fill="%234b5563" /><rect width="10" height="10" x="0" y="10" fill="%234b5563" /></svg>')` }}
      />
      <img src={src} alt={alt} className="relative w-full h-full object-contain" />
      <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 bg-gray-900/50 rounded-full text-white hover:bg-indigo-600/80 backdrop-blur-sm transition-colors"
            title="Download Image"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 bg-gray-900/50 rounded-full text-white hover:bg-red-600/80 backdrop-blur-sm transition-colors"
            title="Remove Image"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {children && (
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {children}
        </div>
      )}
    </div>
  );
};
