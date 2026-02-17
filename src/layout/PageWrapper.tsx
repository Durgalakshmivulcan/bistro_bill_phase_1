import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-[#f8f5ef]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default PageWrapper;
