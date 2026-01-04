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

    // Store test ID and token in sessionStorage before redirecting
    // This ensures they're available even if URL params are read before redirect completes
    sessionStorage.setItem('pending_test_id', testId.toString())
    sessionStorage.setItem('pending_token', token)
    sessionStorage.setItem('redirect_timestamp', Date.now().toString())

    // Also pass in URL as fallback
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
          <div className="header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Continue your TOEFL preparation track.</p>
          </div>
          <div className="header-right">
            <div className="free-plan">
              {/* <div className="free-plan-content"> */}
                <img src="/assets/crown-2.png" alt="Crown icon" className="crown-icon" />
                <div className="plan-details">
                  <span className="plan-text">Free Plan</span>
                  {/* <span className="tests-count">1/5 Tests Available</span> */}
                </div>
              {/* </div> */}
              <button className="upgrade-button">Upgrade</button>
            </div>
          </div>
        </div>

        <div className="tests-section">
          <div className="tests-grid">
            <div className="test-card available">
              
              <div className="test-card-content">
                <div className='test-info-wrapper'>
                  <img src="/assets/files.png" alt="Test icon" className="test-icon" />
                  <div className="test-header">
                    <div className="test-info">
                      <h3 className="test-name">TOEFL Diagnostic Mock #01</h3>
                      <span className="test-status available">Available</span>
                    </div>
                    <div className="test-details">
                      <span className="detail-item">28 Questions</span>
                      <span className="detail-item">35 mins</span>
                      <span className="detail-item">Last Score: 26/30</span>
                    </div>
                  </div>
                </div>
                <button className="test-button start-button" onClick={() => handleStartTest(1)}>
                  Start Test
                </button>
              </div>
            
            </div>

            <div className="test-card premium">
              <div className="test-card-content">
                <div className='test-info-wrapper'>
                  <img src="/assets/files.png" alt="Test icon" className="test-icon" />
                  <div className="test-header">
                    <div className="test-info">
                      <h3 className="test-name">TOEFL Diagnostic Mock #02</h3>
                      <span className="test-status premium">Premium</span>
                    </div>
                    <div className="test-details">
                      <span className="detail-item">28 Questions</span>
                      <span className="detail-item">35 mins</span>
                      <span className="detail-item">Last Score: 26/30</span>
                    </div>
                  </div>
                </div>
                <button className="test-button start-button" onClick={() => handleStartTest(1)}>
                  Start Test
                </button>
              </div>
            </div>

            <div className="test-card premium">
              <div className="test-card-content">
                <div className='test-info-wrapper'>
                  <img src="/assets/files.png" alt="Test icon" className="test-icon" />
                  <div className="test-header">
                    <div className="test-info">
                      <h3 className="test-name">TOEFL Diagnostic Mock #03</h3>
                      <span className="test-status premium">Premium</span>
                    </div>
                    <div className="test-details">
                      <span className="detail-item">28 Questions</span>
                      <span className="detail-item">35 mins</span>
                      <span className="detail-item">Last Score: 26/30</span>
                    </div>
                  </div>
                </div>
                <button className="test-button start-button" onClick={() => handleStartTest(1)}>
                  Start Test
                </button>
              </div>
            </div>

            <div className="test-card premium">
              <div className="test-card-content">
                <div className='test-info-wrapper'>
                  <img src="/assets/files.png" alt="Test icon" className="test-icon" />
                  <div className="test-header">
                    <div className="test-info">
                      <h3 className="test-name">TOEFL Diagnostic Mock #04</h3>
                      <span className="test-status premium">Premium</span>
                    </div>
                    <div className="test-details">
                      <span className="detail-item">28 Questions</span>
                      <span className="detail-item">35 mins</span>
                      <span className="detail-item">Last Score: 26/30</span>
                    </div>
                  </div>
                </div>
                <button className="test-button start-button" onClick={() => handleStartTest(1)}>
                  Start Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

