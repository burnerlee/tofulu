import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function Dashboard() {
  const { user, getToken } = useAuth()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Platform URL - can be configured via environment variable
  const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || 'http://localhost:5174'

// Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = getToken()
        
        if (!token) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/tests`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication failed. Please log in again.')
          } else {
            setError('Failed to load tests. Please try again.')
          }
          setLoading(false)
          return
        }

        const testsData = await response.json()
        setTests(testsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tests:', error)
        setError('Network error. Please check your connection and try again.')
        setLoading(false)
      }
    }

    fetchTests()
  }, [getToken])

  // Use user's name if available, otherwise fallback to email username
  const userName = user?.name || user?.email?.split('@')[0] || 'there'

  const handleStartTest = (testId) => {
    // Get authentication token from localStorage
    const token = getToken()
    
    if (!token) {
      // If no token, redirect to login
      window.location.href = '/login'
      return
    }

    // Redirect to platform with test ID and token as query parameters
    // The platform will store the token in its own localStorage and remove it from URL
    const params = new URLSearchParams({
      test: testId.toString(),
      token: token
    })
    window.location.href = `${PLATFORM_URL}?${params.toString()}`
  }

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="greeting-emoji">🤝</div>
          <h1 className="greeting-text">
            Welcome back, {userName}!
          </h1>
        </div>

        <div className="tests-section">
          <h2 className="tests-title">Available Tests</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading tests...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#dc3545' }}>{error}</p>
            </div>
          ) : tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No tests available.</p>
            </div>
          ) : (
            <div className="tests-grid">
              {tests.map((test) => (
              <div
                key={test.id}
                className={`test-card ${test.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="test-card-content">
                  <div className="test-icon">
                    {test.unlocked ? '📝' : '🔒'}
                  </div>
                  <h3 className="test-name">{test.name}</h3>
                  {test.unlocked ? (
                    <button 
                      className="test-button start-button"
                      onClick={() => handleStartTest(test.id)}
                    >
                      Start Test
                    </button>
                  ) : (
                    <div className="test-locked-message">
                      Locked
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

