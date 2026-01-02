import React from 'react'
import './CTA.css'

function CTA() {
  return (
    <section className="cta">
      <div className="cta-container">
        <h2 className="cta-title">Ready to elevate your assessments?</h2>
        <p className="cta-subtitle">
          Join thousands of test takers to start intelligent exam prep today.
        </p>
        <div className="cta-buttons">
          <button className="cta-button primary" onClick={() => navigate('/login')}>
            Get Started for Free
          </button>
          {/* <button className="cta-button secondary">
            Contact Sales
          </button> */}
        </div>
      </div>
    </section>
  )
}

export default CTA
