import DashboardLayout from "@/components/Layouts/DashboardLayout";

export default function ProtectedLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
