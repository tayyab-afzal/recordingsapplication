"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import AuthCard from "@/components/Auth/AuthCard";
import ErrorMessage from "@/components/Auth/ErrorMessage";

const validateName = (value) => {
  if (!value) return "Name is required";
  if (value.length < 2) return "Name must be at least 2 characters";
  if (value.length > 50) return "Name must be less than 50 characters";
  if (!/^[a-zA-Z\s]+$/.test(value))
    return "Name can only contain letters and spaces";
  return true;
};

const validateEmail = (value) => {
  if (!value) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  return true;
};

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

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email.toLowerCase().trim(),
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      router.push("/sign-in?registered=true");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthCard title="Create an Account">
      <ErrorMessage message={error} onClose={() => setError(null)} />

      <form
        onSubmit={handleSubmit(
          async (data) => {
            try {
              await onSubmit(data);
            } catch (err) {
              setError("Something went wrong. Please try again.");
            }
          },
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
              <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="name"
              type="text"
              placeholder="Name"
              {...register("name", { validate: validateName })}
              className={`form-input input-with-icon ${
                errors.name ? "input-error" : ""
              }`}
            />
          </div>
          {errors.name && (
            <p className="input-error-message">{errors.name.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email", {
                validate: validateEmail,
                setValueAs: (value) => value?.toLowerCase().trim(),
              })}
              className={`form-input input-with-icon ${
                errors.email ? "input-error" : ""
              }`}
            />
          </div>
          {errors.email && (
            <p className="input-error-message">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              id="password"
              type="password"
              placeholder="Password"
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
          {isSubmitting ? <div className="spin-load-btn" /> : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="url-text text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/sign-in" className="url">
            Sign in
          </a>
        </p>
      </div>
    </AuthCard>
  );
}
