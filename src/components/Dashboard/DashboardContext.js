"use client";

import { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [activeModule, setActiveModule] = useState("overview");

  return (
    <DashboardContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
