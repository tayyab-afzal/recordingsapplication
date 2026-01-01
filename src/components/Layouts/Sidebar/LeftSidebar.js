"use client";

import { useSession } from "next-auth/react";
import {
  UserGroupIcon,
  MicrophoneIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const modules = [
  { id: "recordings", label: "Recordings", icon: MicrophoneIcon },
  { id: "users", label: "Users", icon: UserGroupIcon },
  { id: "password", label: "Password", icon: LockClosedIcon },
];

export default function LeftSidebar({ activeModule, onModuleChange }) {
  const { data: session } = useSession();

  const handleModuleClick = (moduleId) => {
    onModuleChange(moduleId);
  };

  return (
    <div className="sidebar-left-container flex flex-col h-full">
      <div className="sidebar-user-info p-4">
        <div className="sidebar-user-name font-semibold px-4">
          {session?.user?.name || "User"}
        </div>
        <div className="sidebar-user-email text-sm px-4">
          {session?.user?.email || ""}
        </div>
      </div>
      <div className="sidebar-modules-section flex-1 p-4 flex flex-col justify-between">
        <div>
          <nav className="sidebar-nav flex flex-col gap-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={`sidebar-module-button ${
                    activeModule === module.id
                      ? "sidebar-module-button-active"
                      : "sidebar-module-button-inactive"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="body-text">{module.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
