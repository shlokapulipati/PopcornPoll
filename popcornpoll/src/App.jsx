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
import MovieView from "./pages/MovieView";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
import "./App.css";
  
const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/poll/create" element={<PollCreate />} />
            <Route path="/poll/:id" element={<PollView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/movie/:id" element={<MovieView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <AuthModal />
    </div>
  );
};

export default App;
