
import React from 'react';
import type { GeneratedImage } from '../types';
import { DownloadIcon, XIcon } from './Icons';

interface GalleryModalProps {
  images: GeneratedImage[];
  isOpen: boolean;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ images, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = (base64: string, id: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `ai-creation-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Your Creations Gallery</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
          {images.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Your saved creations will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div key={image.id} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={`data:image/png;base64,${image.base64}`}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-xs line-clamp-3 mb-2">{image.prompt}</p>
                    <button
                      onClick={() => handleDownload(image.base64, image.id)}
                      className="self-end p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors"
                      title="Download Image"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
