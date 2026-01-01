"use client";

import { useState } from "react";
import Header from "./Header/Header";
import LeftSidebar from "./Sidebar/LeftSidebar";
import ResizableSidebar from "./Sidebar/ResizableSidebar";
import {
  DashboardProvider,
  useDashboard,
} from "@/components/Dashboard/DashboardContext";

function DashboardContent({ children }) {
  const { activeModule, setActiveModule } = useDashboard();
  const [leftWidth, setLeftWidth] = useState(256);

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-content-wrapper">
        <ResizableSidebar
          side="left"
          defaultWidth={256}
          minWidth={200}
          maxWidth={600}
          onResize={setLeftWidth}
        >
          <aside className="dashboard-sidebar-left">
            <LeftSidebar
              activeModule={activeModule}
              onModuleChange={setActiveModule}
            />
          </aside>
        </ResizableSidebar>

        <main className="dashboard-main">
          <div className="dashboard-main-container">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
