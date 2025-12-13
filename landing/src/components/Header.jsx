import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

function Header() {
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isLandingPage = location.pathname === '/'
  const isDashboard = location.pathname === '/dashboard'
  const isPlansPage = location.pathname === '/plans'
  const isAuthenticatedPage = isDashboard || isPlansPage
  
  return (
    <header className={`header ${isAuthenticatedPage ? 'header-dashboard' : ''}`}>
      <div className={`header-container ${isAuthenticatedPage ? 'header-container-dashboard' : ''}`}>
        <Link to="/" className="logo">
          <div className="logo-icon">
            <div className="crescent"></div>
          </div>
          <span className="logo-text">Testino</span>
        </Link>
        <div className="header-actions">
          {isLandingPage ? (
            // Landing page always shows "Free Practice Test"
            <Link to="/login" className="download-link">
              Free Practice Test
              <span className="arrow">→</span>
            </Link>
          ) : isAuthenticatedPage && isAuthenticated ? (
            // Dashboard and Plans pages show Unlock Tests button and sign out when authenticated
            <>
              {!isPlansPage && (
                <Link to="/plans" className="unlock-button">
                  Unlock Tests
                </Link>
              )}
              {user?.name && (
                <span className="user-name">Hi, {user.name}</span>
              )}
              <button onClick={logout} className="logout-button">
                Sign out
              </button>
            </>
          ) : !isAuthPage && !isAuthenticated ? (
            // Other pages show "Free Practice Test" when not authenticated
            <Link to="/login" className="download-link">
              Free Practice Test
              <span className="arrow">→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Header

