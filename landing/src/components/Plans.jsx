import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import './Plans.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function Plans() {
  const { user, getToken, checkAuthStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setRazorpayLoaded(true))
      if (window.Razorpay) {
        setRazorpayLoaded(true)
      }
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      setRazorpayLoaded(true)
    }
    script.onerror = () => {
      setError('Failed to load payment gateway. Please refresh the page and try again.')
    }
    document.body.appendChild(script)
  }, [])

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Create order on server
      const orderResponse = await fetch(`${API_BASE_URL}/api/v1/payments/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100000, // ₹1000 in paise (1000 * 100)
          currency: 'INR',
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create order')
      }

      const orderData = await orderResponse.json()

      // Initialize Razorpay checkout
      const options = {
        key: orderData.key_id, // Razorpay key ID from server
        amount: orderData.amount, // Amount in currency subunits
        currency: orderData.currency,
        name: 'Testino',
        description: 'Lifetime Premium Access - Unlock All Tests',
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.contact || '',
        },
        theme: {
          color: '#086A6F',
        },
        handler: async function (response) {
          // Handle successful payment
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/v1/payments/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}))
              throw new Error(errorData.message || 'Payment verification failed')
            }

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              // Refresh user data to get updated premium status
              await checkAuthStatus()
              
              // Show success message and redirect to dashboard
              alert('Payment successful! Your account has been upgraded to Premium.')
              window.location.href = '/dashboard'
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            alert('Payment verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)
    } catch (error) {
      console.error('Payment error:', error)
      setError(error.message || 'Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="plans-page">
      <Header />
      <div className="plans-container">
        <div className="plans-header">
          <h1 className="plans-title">Unlock All Tests</h1>
          <p className="plans-subtitle">Get lifetime access to all premium features</p>
        </div>

        <div className="plan-card">
          <div className="plan-badge">Best Value</div>
          <div className="plan-content">
            <h2 className="plan-name">Premium Lifetime</h2>
            <div className="plan-price">
              <span className="price-amount">₹1000</span>
              <span className="price-period">one-time</span>
            </div>
            <ul className="plan-features">
              <li className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Unlock all tests for lifetime</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Quick AI graded responses to subjective questions</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Access to all future test updates</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
            {error && (
              <div className="error-message">{error}</div>
            )}
            <button
              className="pay-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Plans

