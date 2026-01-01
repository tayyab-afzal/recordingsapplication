"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import AuthCard from "@/components/Auth/AuthCard";
import ErrorMessage from "@/components/Auth/ErrorMessage";
import SuccessMessage from "@/components/Auth/SuccessMessage";

const validateEmail = (value) => {
  if (!value) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Invalid email address";
  return true;
};

const validatePassword = (value) => {
  if (!value) return "Password is required";
  return true;
};

export default function SignInPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [error, setError] = useState(null);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(sp.get("registered"));

  const {
    register,
    handleSubmit,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    shouldFocusError: true,
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const onPassword = async (data) => {
    setError(null);

    if (!data.password) {
      setError("Password is required");
      return;
    }

    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      headers: { Accept: "application/json" },
    });

    if (!res) return;

    if (res.error) {
      if (res.error === "CODE_REQUIRED") {
        setCodeStep(true);
        return;
      }

      const errorMessages = {
        USER_NOT_FOUND: "No account found with this email address",
        INVALID_PASSWORD: "Incorrect password. Please try again",
        PASSWORD_REQUIRED: "Password is required",
        CredentialsSignin: "Invalid email or password",
      };

      setError(errorMessages[res.error] || res.error);
      return;
    }
    router.push("/dashboard");
  };

  const onCode = async () => {
    setError(null);
    const email = getValues("email");

    if (code.length !== 6) {
      setError("Please enter a 6-digit verification code");
      return;
    }

    try {
      setIsCodeSubmitting(true);
      const res = await signIn("credentials", {
        redirect: false,
        email,
        code,
      });

      if (!res) return;

      if (res.error) {
        const errorMessages = {
          INVALID_CODE_FORMAT: "Please enter a valid 6-digit code",
          NO_CODE_FOUND: "No verification code found.",
          CODE_EXPIRED: "Verification code has expired.",
          INVALID_CODE: "Invalid verification code.",
          USER_NOT_FOUND: "Account not found. Please try signing in again",
        };

        setError(errorMessages[res.error] || res.error);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCodeSubmitting(false);
    }
  };

  return (
    <AuthCard title={<>Sign in to Recordings Application</>}>
      {showSuccess && (
        <SuccessMessage message="Account created successfully! Please sign in." />
      )}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {!codeStep ? (
        <form
          onSubmit={handleSubmit(onPassword, (errors) => {
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
              setFocus(firstErrorField);
            }
          })}
          className="space-y-4"
          noValidate
        >
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              type="email"
              placeholder="Email"
              {...register("email", { validate: validateEmail })}
              className={`form-input input-with-icon ${
                errors.email ? "input-error" : ""
              }`}
            />
          </div>
          {errors.email && (
            <p className="input-error-message">{errors.email.message}</p>
          )}

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
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
              <span>Continue</span>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="form-input-code text-center text-lg tracking-widest"
          />
          <p className="url-text text-gray-500 dark:text-gray-400 mt-1">
            We sent a 6-digit code to your email
          </p>
          <button
            type="button"
            onClick={onCode}
            disabled={isCodeSubmitting || code.length !== 6}
            className={`w-full btn-primary py-3 text-lg font-semibold ${
              isCodeSubmitting ? "btn-loading" : ""
            }`}
          >
            {isCodeSubmitting ? (
              <div className="spin-load-btn" />
            ) : (
              <span>Verify</span>
            )}
          </button>
        </div>
      )}

      {!codeStep && (
        <div className="mt-8 flex justify-center gap-2">
          <a href="/sign-up" className="url">
            Create Account
          </a>
          <span>|</span>
          <a href="/forgot" className="url">
            Forgot password?
          </a>
        </div>
      )}
    </AuthCard>
  );
}
