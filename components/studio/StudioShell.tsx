"use client";

import { useState } from "react";
import StudioNav from "./StudioNav";
import StudioTopbar from "./StudioTopbar";

export default function StudioShell({
  isAdmin,
  name,
  username,
  image,
  logo,
  appName,
  children,
}: {
  isAdmin: boolean;
  name: string;
  username: string | null;
  image: string | null;
  logo: string | null;
  appName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function onMenu() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((v) => !v);
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <div className="min-h-screen bg-yt-base text-yt-text">
      <StudioTopbar image={image} logo={logo} appName={appName} onMenu={onMenu} />
      <div className="flex">
        <StudioNav
          isAdmin={isAdmin}
          name={name}
          username={username}
          image={image}
          open={open}
          collapsed={collapsed}
          onClose={() => setOpen(false)}
        />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 px-4 py-6 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
