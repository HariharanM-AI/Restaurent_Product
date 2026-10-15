"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Ambient } from "@/components/ui/ambient";

interface SidebarContextType {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: true,
  toggle: () => {},
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggle = useCallback(() => setIsCollapsed((c) => !c), []);
  const setCollapsed = useCallback((v: boolean) => setIsCollapsed(v), []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
      <div className="admin-canvas glass-ui relative min-h-screen flex flex-col lg:flex-row">
        <Ambient />
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
