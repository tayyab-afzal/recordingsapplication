import { withAuth } from "next-auth/middleware";

export default withAuth(
  function proxy(req) {
    return;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
