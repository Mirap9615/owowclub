import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Activities from './Activities.jsx';
import NotFound from './NotFound.jsx'; 
import Membership from './Membership.jsx';
import About from './About.jsx';
import Cal from './Calendar.jsx'
import Soon from './Soon.jsx'

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/calendar" element={<Cal />} />
        <Route path="/activities" element={<Activities />} />
        
        <Route path="/gallery" element={<Soon />} />
        <Route path="/settings" element={<Soon />} />
        <Route path="/login" element={<Soon />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
