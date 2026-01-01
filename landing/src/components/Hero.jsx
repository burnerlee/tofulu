import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import tick from '../assets/correct.png'


function Hero() {
  const navigate = useNavigate()

  return (
    <section className="hero">
      <div className="hero-content">
        {/* <div className="hero-badge">
          <span className="badge-icon">✨</span>
          <span className="badge-text">The #1 Rated TOEFL Prep in 2026</span>
        </div> */}
        <h1 className="hero-headline">
          MASTER YOUR<br />
          FUTURE.
        </h1>
        <div className="hero-subheadline-container">
          <p className="hero-subheadline-line1">
            Your Ultimate TOEFL Preparation Platform
          </p>
          <p className="hero-subheadline-line2">
            for the <span className="hero-subheadline-highlight">New Jan 2026 Format</span>
          </p>
        </div>
        <button 
          className="hero-button hero-button-primary"
          onClick={() => navigate('/login')}
        >
          Start preparation for free
          <span className="button-arrow">→</span>
        </button>
        <div className="hero-features">
        <div className="hero-feature">
          <img src={tick} alt="tick-icon" className="tick-icon-img" />
          <p className='feature'>REAL TEST SIMULATION</p>
        </div>
        <div className="hero-feature">
        <img src={tick} alt="tick-icon" className="tick-icon-img" />
        <p className='feature'>INSTANT SCORING</p>
        </div> 
        <div className="hero-feature">
        <img src={tick} alt="tick-icon" className="tick-icon-img" />
        <p className='feature'>5 MOCK TESTS</p>
        </div> 
        </div>
      </div>
    </section>
  )
}

export default Hero

