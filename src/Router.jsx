import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainManager from './MainManager.jsx';
import Activities from './Activities.jsx';
import NotFound from './NotFound.jsx'; 

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainManager />} />
        <Route path="/home" element={<MainManager />} />
        <Route path="/about" element={<NotFound />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
