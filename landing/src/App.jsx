import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import Plans from './components/Plans'
import SEO from './components/SEO'
import './App.css'

function Home() {
  return (
    <>
      <SEO 
        title="TOEFL Practice Tests & Exam Preparation - Testino | New Format 2026"
        description="Master the TOEFL exam with our comprehensive practice tests, mock exams, and exam preparation platform. Experience the new TOEFL format (2026) with authentic test simulations, instant AI grading, and detailed performance reports. Start your free TOEFL preparation today!"
        keywords="TOEFL practice tests, TOEFL exam preparation, TOEFL mock tests, TOEFL new format, TOEFL practice tests new format, TOEFL 2026, TOEFL preparation platform, TOEFL online practice, TOEFL test simulation, TOEFL study guide"
      />
      <div className="app">
        <Header />
        <Hero />
        <Features />
        <Footer />
      </div>
    </>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div> // You can add a proper loading component
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  // If already logged in, redirect to dashboard
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <SEO 
                  title="TOEFL Dashboard - Track Your Progress | Testino"
                  description="Access your TOEFL practice test results, track your progress, and view detailed performance reports on your personalized dashboard."
                  noindex={true}
                />
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <SEO 
                  title="Login to TOEFL Practice Platform - Testino"
                  description="Login to access your TOEFL practice tests, mock exams, and exam preparation resources."
                  noindex={true}
                />
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SEO 
                  title="Sign Up for Free TOEFL Practice Tests - Testino"
                  description="Create a free account to start practicing TOEFL tests, access mock exams, and prepare for the new TOEFL format (2026)."
                />
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/plans" 
            element={
              <ProtectedRoute>
                <SEO 
                  title="Premium Plans - Unlock All Tests | Testino"
                  description="Upgrade to Premium and unlock all TOEFL practice tests with lifetime access and AI-graded responses."
                  noindex={true}
                />
                <Plans />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

