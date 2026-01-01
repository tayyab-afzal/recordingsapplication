"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import AuthCard from "@/components/Auth/AuthCard";
import ErrorMessage from "@/components/Auth/ErrorMessage";
import SuccessMessage from "@/components/Auth/SuccessMessage";

const validateEmail = (value) => {
  if (!value) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  return true;
};

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const onSubmit = async (data) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase().trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to send reset email");
        return;
      }
      setSent(true);
    } catch (e) {
      setError("Network error");
    }
  };

  return (
    <AuthCard
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
    >
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {sent && <SuccessMessage message="Email sent successfuly" />}

      <form
        onSubmit={handleSubmit(
          onSubmit,
          (errors) => {
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
              setFocus(firstErrorField);
            }
          }
        )}
        className="space-y-4"
        noValidate
      >
        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email", { validate: validateEmail })}
              className={`form-input input-with-icon ${
                errors.email ? "input-error" : ""
              }`}
            />
          </div>
          {errors.email && (
            <p className="input-error-message">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full btn-primary py-3 text-lg font-semibold ${
            isSubmitting ? "btn-loading" : ""
          }`}
        >
          {isSubmitting ? (
            <div className="spin-load-btn" />
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href="/sign-in" className="url">
          Back to Sign In
        </a>
      </div>
    </AuthCard>
  );
}
