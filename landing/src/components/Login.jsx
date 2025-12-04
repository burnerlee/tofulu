import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function Login() {
  const [email, setEmail] = useState('')
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setSuccess('Verification code sent successfully to your email')
        setError('')
      } else {
        setError(data.detail || 'Failed to send verification code. Please try again.')
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
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store auth token and update auth context
        if (data.access_token) {
          login(data.access_token)
        }
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        setError(data.detail || 'Invalid verification code. Please try again.')
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
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <div className="crescent"></div>
            </div>
            <span className="logo-text">Testino</span>
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to continue your TOEFL preparation</p>
        </div>

        {!otpSent ? (
          <form className="login-form" onSubmit={handleSendOTP}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
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

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send verification code'}
              {!loading && <span className="button-arrow">→</span>}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleVerifyOTP}>
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
              <button type="submit" className="login-button" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify and sign in'}
                {!loading && <span className="button-arrow">→</span>}
              </button>
              <button type="button" className="resend-button" onClick={handleResendOTP}>
                Change email
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p className="signup-text">
            Don't have an account?{' '}
            <Link to="/signup" className="signup-link">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login


