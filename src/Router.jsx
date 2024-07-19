import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Activities from './Activities.jsx';
import NotFound from './NotFound.jsx'; 
import Membership from './Membership.jsx';
import About from './About.jsx';
import Cal from './Calendar.jsx'
import Soon from './Soon.jsx'
import Login from './Login.jsx'
import Settings from './Settings.jsx'
import Register from './Register.jsx'
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import MemberHome from './MemberHome.jsx';
import ProtectedRoute from './ProtectedRoute.jsx'
import NoPermission from './NoPermission.jsx'

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/activities" element={<Activities />} />

        <Route path="/calendar" element={<ProtectedRoute element={Cal} />} />
        <Route path="/gallery" element={<ProtectedRoute element={Soon} />} />
        <Route path="/settings" element={<ProtectedRoute element={Settings} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/member-home" element={<ProtectedRoute element={MemberHome} />} />
        <Route path="/no-permission" element={<NoPermission />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
