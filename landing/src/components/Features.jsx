import React, { useEffect, useRef, useState } from 'react'
import './Features.css'

function Features() {
  const [visibleCards, setVisibleCards] = useState([])
  const cardRefs = useRef([])

  useEffect(() => {
    const observers = []

    cardRefs.current.forEach((card, index) => {
      if (!card) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => {
                if (!prev.includes(index)) {
                  return [...prev, index]
                }
                return prev
              })
              observer.unobserve(entry.target)
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      )

      observer.observe(card)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  return (
    <section className="features">
      <div className="features-container">
        <h2 className="features-title">Why Choose Testino?</h2>
        <p className="features-subtitle">Everything you need to assess better</p>
        <div className="features-grid">
          <div 
            ref={(el) => (cardRefs.current[0] = el)}
            className={`feature-card ${visibleCards.includes(0) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Secure Environment</h3>
            <p className="feature-description">
              Advanced browser lockdown and proctoring capabilities ensure assessment integrity.
            </p>
          </div>

          <div 
            ref={(el) => (cardRefs.current[1] = el)}
            className={`feature-card ${visibleCards.includes(1) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10M12 20V4M6 20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Instant Analytics</h3>
            <p className="feature-description">
              Real-time grading and detailed performance insights for students and classes.
            </p>
          </div>

          <div 
            ref={(el) => (cardRefs.current[2] = el)}
            className={`feature-card ${visibleCards.includes(2) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Lightning Fast</h3>
            <p className="feature-description">
              Optimized for speed and reliability, ensuring smooth testing even with low bandwidth.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features

