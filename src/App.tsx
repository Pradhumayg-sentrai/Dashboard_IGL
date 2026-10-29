import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './features/layout/AppLayout';
import { WallDisplayPage } from './pages/WallDisplayPage';
import { BayCockpitPage } from './pages/BayCockpitPage';
import { PlantManagerPage } from './pages/PlantManagerPage';
import { ExciseCompliancePage } from './pages/ExciseCompliancePage';
import { HelpPage } from './pages/HelpPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/wall" replace />} />
          <Route path="/wall" element={<WallDisplayPage />} />
          <Route path="/bay" element={<Navigate to="/bay/1" replace />} />
          <Route path="/bay/:id" element={<BayCockpitPage />} />
          <Route path="/plant" element={<PlantManagerPage />} />
          <Route path="/excise" element={<ExciseCompliancePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/wall" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
