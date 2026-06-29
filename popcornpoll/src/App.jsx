import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/Auth/AuthModal";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import PollCreate from "./pages/PollCreate";
import PollView from "./pages/PollView";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import "./App.css";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/poll/create" element={<PollCreate />} />
          <Route path="/poll/:id" element={<PollView />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <AuthModal />
    </div>
  );
};

export default App;
