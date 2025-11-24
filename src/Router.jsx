import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Activities from './Activities.jsx';
import NotFound from './NotFound.jsx';
import Membership from './Membership.jsx';
import About from './About.jsx';
import Events from './Events.jsx'
import Soon from './Soon.jsx'
import Login from './Login.jsx'
import Settings from './Settings.jsx'
import Register from './Register.jsx'
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import MemberHome from './MemberHome.jsx';
import ProtectedRoute from './ProtectedRoute.jsx'
import NoPermission from './NoPermission.jsx'
import Gallery from './Gallery.jsx'
import Logout from './Logout.jsx'
import Request from './Request.jsx'
import Admin from './Admin.jsx'
import Applications from './Applications.jsx'
import ActivitiesMember from './ActivitiesMember.jsx'
import Users from './Users.jsx'
import EventPage from './Event.jsx'
import EventInviteHandler from './EventInviteHandler.jsx';
import Mail from './Mail.jsx'

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/activities" element={<Activities />} />

        <Route path="/events" element={<ProtectedRoute element={Events} />} />
        <Route path="/gallery" element={<ProtectedRoute element={Gallery} />} />
        <Route path="/settings" element={<ProtectedRoute element={Settings} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/:token" element={<Register />} />
        <Route path="/request" element={<Request />} />

        <Route path="/events/invite/:token" element={<EventInviteHandler />} />
        <Route path="/events/:id" element={<EventPage />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/member-home" element={<ProtectedRoute element={MemberHome} />} />
        <Route path="/no-permission" element={<NoPermission />} />

        <Route path="/activities-member" element={<ProtectedRoute element={ActivitiesMember} />} />

        <Route path="/admin" element={<ProtectedRoute element={Admin} />} />
        <Route path="/applications" element={<ProtectedRoute element={Applications} />} />
        <Route path="/users" element={<ProtectedRoute element={Users} />} />
        <Route path="/mail" element={<ProtectedRoute element={Mail} />} />

        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
