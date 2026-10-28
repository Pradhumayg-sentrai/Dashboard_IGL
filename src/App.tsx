import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './features/layout/AppLayout';
import { WallDisplayPage } from './pages/WallDisplayPage';
import { BayCockpitPage } from './pages/BayCockpitPage';
import { PlantManagerPage } from './pages/PlantManagerPage';
import { ExciseCompliancePage } from './pages/ExciseCompliancePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/plant" replace />} />
          <Route path="/wall" element={<WallDisplayPage />} />
          <Route path="/bay/:id" element={<BayCockpitPage />} />
          <Route path="/plant" element={<PlantManagerPage />} />
          <Route path="/excise" element={<ExciseCompliancePage />} />
          <Route path="*" element={<Navigate to="/plant" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
