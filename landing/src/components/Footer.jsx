import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a 
            href="https://merchant.razorpay.com/policy/RncdqXFcgqfLsr/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Terms and Conditions
          </a>
          <span className="footer-separator">·</span>
          <a 
            href="https://merchant.razorpay.com/policy/RncdqXFcgqfLsr/contact_us" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Contact Us
          </a>
          <span className="footer-separator">·</span>
          <a 
            href="https://merchant.razorpay.com/policy/RncdqXFcgqfLsr/refund" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Cancellation and Refund Policy
          </a>
          <span className="footer-separator">·</span>
          <a 
            href="https://merchant.razorpay.com/policy/RncdqXFcgqfLsr/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

