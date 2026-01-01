"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { LockClosedIcon } from "@heroicons/react/24/outline";
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

export default function PasswordModule() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));

        let errorMessage = j.error || "Failed to change password";

        if (res.status === 401) {
          errorMessage = j.error || "Current password is incorrect";
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

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div>
      <div className="dashboard-card w-2/5 mx-auto">
        <ErrorMessage message={error} onClose={() => setError(null)} />
        {success && <SuccessMessage message="Password changed successfully!" />}

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
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Current Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                id="currentPassword"
                type="password"
                placeholder="Enter your current password"
                {...register("currentPassword", {
                  validate: (value) => {
                    if (!value) return "Current password is required";
                    return true;
                  },
                })}
                className={`form-input input-with-icon ${
                  errors.currentPassword ? "input-error" : ""
                }`}
              />
            </div>
            {errors.currentPassword && (
              <p className="input-error-message">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                {...register("newPassword", { validate: validatePassword })}
                className={`form-input input-with-icon ${
                  errors.newPassword ? "input-error" : ""
                }`}
              />
            </div>
            {errors.newPassword && (
              <p className="input-error-message">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                {...register("confirmPassword", {
                  validate: (value) =>
                    validateConfirmPassword(value, { password: newPassword }),
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
            className={`w-full btn-primary py-3 text-lg font-semibold mt-6 ${
              isSubmitting ? "btn-loading" : ""
            }`}
          >
            {isSubmitting ? (
              <div className="spin-load-btn" />
            ) : (
              <span>Change Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
