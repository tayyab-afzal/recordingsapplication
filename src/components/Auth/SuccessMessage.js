"use client";

export default function SuccessMessage({ message }) {
  if (!message) return null;

  return (
    <div className="success-text animate-fade-in">
      <p>{message}</p>
    </div>
  );
}
