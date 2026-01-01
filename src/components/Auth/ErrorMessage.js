"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ErrorMessage({ message, onClose }) {
  if (!message || message.trim() === "") return null;

  return (
    <div className="error-text animate-fade-in">
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="close-btn-error"
          aria-label="Close error message"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
