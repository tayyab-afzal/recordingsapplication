import { Suspense } from "react";
import SignUpPage from "./SignUp";

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-transparent"></div>
        </div>
      }
    >
      <SignUpPage />
    </Suspense>
  );
}
