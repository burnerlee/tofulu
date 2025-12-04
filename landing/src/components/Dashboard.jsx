import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()

  // Test data - 1 unlocked, 4 locked
  const tests = [
    { id: 1, name: 'TOEFL Mock Test 1', unlocked: true },
    { id: 2, name: 'TOEFL Mock Test 2', unlocked: false },
    { id: 3, name: 'TOEFL Mock Test 3', unlocked: false },
    { id: 4, name: 'TOEFL Mock Test 4', unlocked: false },
    { id: 5, name: 'TOEFL Mock Test 5', unlocked: false },
  ]

  const userName = user?.name || user?.email?.split('@')[0] || 'there'

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
                    <button className="test-button start-button">
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
        </div>
      </div>
    </div>
  )
}

export default Dashboard

