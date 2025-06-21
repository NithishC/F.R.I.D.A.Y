import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import DestinationsPage from './pages/DestinationsPage';
import PreferencesPage from './pages/PreferencesPage';
import HistoryPage from './pages/HistoryPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import ConsentCallbackPage from './pages/ConsentCallbackPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="destinations" element={<DestinationsPage />} />
        <Route path="destinations/:id" element={<DestinationDetailPage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
      <Route path="/callback" element={<ConsentCallbackPage />} />
    </Routes>
  );
};

export default App;
