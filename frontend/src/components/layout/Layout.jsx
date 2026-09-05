import React from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export const Layout = ({ children, currentRun, onRefresh, loading, planDate }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          currentRun={currentRun}
          onRefresh={onRefresh}
          loading={loading}
          planDate={planDate}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
