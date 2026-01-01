"use client";

import { useSession } from "next-auth/react";
import { useDashboard } from "@/components/Dashboard/DashboardContext";
import RecordingsModule from "@/components/Dashboard/Modules/RecordingsModule";
import UsersModule from "@/components/Dashboard/Modules/UsersModule";
import PasswordModule from "@/components/Dashboard/Modules/PasswordModule";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { activeModule } = useDashboard();

  const renderModule = () => {
    switch (activeModule) {
      case "recordings":
        return <RecordingsModule />;
      case "users":
        return <UsersModule />;
      case "password":
        return <PasswordModule />;
      default:
        return <RecordingsModule />;
    }
  };

  return <div>{renderModule()}</div>;
}
