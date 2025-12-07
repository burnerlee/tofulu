import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Signup.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function Signup() {
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  // Pre-fill email if passed from login redirect
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setSuccess('OTP sent successfully to your email address')
        setError('')
      } else {
        // If user already exists (409 Conflict), redirect to login with email pre-filled
        if (response.status === 409) {
          setError('Account already exists. Redirecting to login...')
          setTimeout(() => {
            navigate('/login', { state: { email: email.toLowerCase().trim() } })
          }, 2000)
        } else {
          setError(data.detail || 'Failed to send OTP. Please try again.')
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Error sending OTP:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          otp: otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store auth token and update auth context
        if (data.access_token) {
          login(data.access_token, { email, name: name.trim() })
        }
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        setError(data.detail || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Error verifying OTP:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = () => {
    setOtpSent(false)
    setOtp('')
    setSuccess('')
    setError('')
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="signup-logo">
            <div className="logo-icon">
              <div className="crescent"></div>
            </div>
            <span className="logo-text">Testino</span>
          </div>
          <h1 className="signup-title">Create your account</h1>
          <p className="signup-subtitle">Start your TOEFL preparation journey today</p>
        </div>

        {!otpSent ? (
          <form className="signup-form" onSubmit={handleSendOTP}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">What should we call you?</label>
              <input
                type="text"
                id="name"
                className="form-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send verification code'}
              {!loading && <span className="button-arrow">→</span>}
            </button>
          </form>
        ) : (
          <form className="signup-form" onSubmit={handleVerifyOTP}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label className="form-label">Enter verification code</label>
              <p className="otp-info">
                We've sent a 6-digit verification code to<br />
                <strong>{email}</strong>
              </p>
              <input
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                required
                autoFocus
              />
            </div>

            <div className="otp-actions">
              <button type="submit" className="signup-button" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify and sign up'}
                {!loading && <span className="button-arrow">→</span>}
              </button>
              <button type="button" className="resend-button" onClick={handleResendOTP}>
                Change email
              </button>
            </div>
          </form>
        )}

        <div className="signup-footer">
          <p className="login-text">
            Already have an account?{' '}
            <Link to="/login" className="login-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup

