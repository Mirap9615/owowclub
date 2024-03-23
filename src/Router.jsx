import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainManager from './MainManager.jsx';
import NotFound from './NotFound.jsx'; 

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainManager />} />
        <Route path="/home" element={<MainManager />} />
        <Route path="/about" element={<MainManager />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
