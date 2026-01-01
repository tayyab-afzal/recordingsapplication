"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import AuthCard from "@/components/Auth/AuthCard";
import ErrorMessage from "@/components/Auth/ErrorMessage";
import SuccessMessage from "@/components/Auth/SuccessMessage";

const validatePassword = (value) => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (value.length > 100) return "Password must be less than 100 characters";
  return true;
};

const validateConfirmPassword = (value, formValues) => {
  if (!value) return "Please confirm your password";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (value !== formValues.password) return "Passwords don't match";
  return true;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password: data.password }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));

        let errorMessage = j.error || "Failed to reset password";

        if (res.status === 404) {
          errorMessage =
            "Password reset request not found. Please request a new reset link.";
        } else if (res.status === 410) {
          errorMessage =
            "Password reset request has expired. Please request a new reset link.";
        } else if (res.status === 401) {
          errorMessage =
            "Invalid reset token. Please request a new reset link.";
        } else if (res.status === 400) {
          errorMessage =
            j.error ||
            "Invalid request. Please check your input and try again.";
        } else if (res.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        setError(errorMessage);
        return;
      }

      setOk(true);
      setTimeout(() => router.replace("/sign-in?reset=1"), 1200);
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    }
  };

  if (!token || !email) {
    return (
      <AuthCard
        title="Invalid Reset Link"
        subtitle="The reset link is invalid or has expired"
      >
        <ErrorMessage message="Invalid reset link. Please request a new password reset." />
        <div className="mt-6 text-center">
          <a href="/forgot" className="url">
            Request New Reset Link
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset Password" subtitle="Enter your new password">
      <ErrorMessage message={error} onClose={() => setError(null)} />
      {ok && (
        <SuccessMessage message="Password reset successfully! Redirecting..." />
      )}

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          const firstErrorField = Object.keys(errors)[0];
          if (firstErrorField) {
            setFocus(firstErrorField);
          }
        })}
        className="space-y-4"
        noValidate
      >
        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="password"
              type="password"
              placeholder="New Password"
              {...register("password", { validate: validatePassword })}
              className={`form-input input-with-icon ${
                errors.password ? "input-error" : ""
              }`}
            />
          </div>
          {errors.password && (
            <p className="input-error-message">{errors.password.message}</p>
          )}
        </div>
        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword", {
                validate: (value) =>
                  validateConfirmPassword(value, { password }),
              })}
              className={`form-input input-with-icon ${
                errors.confirmPassword ? "input-error" : ""
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="input-error-message">
              {errors.confirmPassword.message}
            </p>
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
            <span>Reset Password</span>
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
