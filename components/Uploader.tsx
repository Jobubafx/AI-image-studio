
import React, { useCallback, useState } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon } from './Icons';

interface UploaderProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files) {
      const newImageFiles: ImageFile[] = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          id: `${file.name}-${file.lastModified}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      if (newImageFiles.length > 0) {
        onFilesAdded(newImageFiles);
      }
    }
  }, [onFilesAdded]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300
        ${isDragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
        <UploadIcon className="w-12 h-12" />
        <p className="text-lg">
          <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  );
};
