import { Suspense } from "react";
import SignInPage from "./SignIn";

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-transparent"></div>
        </div>
      }
    >
      <SignInPage />
    </Suspense>
  );
}
