import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import laptopImage from '../assets/laptop.png'

function Hero() {
  const navigate = useNavigate()

  return (
    <section className="hero">
      <div className="hero-container">
        <h1 className="hero-headline">
          Your Ultimate TOEFL<br />
          Preparation Platform
        </h1>
        <div className="hero-subheadline-container">
          <p className="hero-subheadline-line1">
            Practice TOEFL tests and master the
          </p>
          <p className="hero-subheadline-line2">
            New TOEFL Format - Jan 2026
          </p>
        </div>
        <button 
          className="cta-button"
          onClick={() => navigate('/login')}
        >
          Start preparation for free
          <span className="button-arrow">→</span>
        </button>
        <img 
          src={laptopImage} 
          alt="TOEFL test interface on laptop" 
          className="laptop-image"
        />
      </div>
    </section>
  )
}

export default Hero

