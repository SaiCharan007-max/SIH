import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Planning } from './pages/Planning';
import { Maintenance } from './pages/Maintenance';
import { Network } from './pages/Network';
import { PlanComparison } from './pages/PlanComparison';

export const App = () => {
  const [currentRun, setCurrentRun] = useState(null);
  const planDate = '2026-09-10';

  return (
    <BrowserRouter>
      <Layout currentRun={currentRun} planDate={planDate}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard planDate={planDate} />} />
          <Route
            path="/planning"
            element={
              <Planning
                planDate={planDate}
                onPlanUpdated={(run) => setCurrentRun(run)}
              />
            }
          />
          <Route path="/maintenance" element={<Maintenance planDate={planDate} />} />
          <Route path="/network" element={<Network planDate={planDate} />} />
          <Route path="/planning/compare" element={<PlanComparison planDate={planDate} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
