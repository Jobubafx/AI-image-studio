import React, { useEffect, useRef } from 'react';

interface RefinementSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isOpen: boolean;
  onClose: () => void;
  targetRef: React.RefObject<HTMLElement>;
}

export const RefinementSuggestions: React.FC<RefinementSuggestionsProps> = ({ suggestions, onSelect, isOpen, onClose, targetRef }) => {
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        targetRef.current &&
        !targetRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, targetRef]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      targetRef.current?.focus();
      return;
    }

    const items = Array.from(dropdownRef.current?.querySelectorAll('button') || []);
    if (!items.length) return;

    const activeIndex = items.findIndex(item => item === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = activeIndex === -1 ? items.length - 1 : (activeIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Focus the container to capture key events, then the first item.
      dropdownRef.current?.focus();
      const firstItem = dropdownRef.current?.querySelector('button');
      firstItem?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
      role="dialog"
      aria-label="Refinement Suggestions"
    >
      <ul
        ref={dropdownRef}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="py-1 focus:outline-none"
        role="listbox"
      >
        {suggestions.map((suggestion, index) => (
          <li key={index} role="option" className="list-none">
            <button
              onClick={() => {
                onSelect(suggestion);
                onClose();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white focus:outline-none transition-colors"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
