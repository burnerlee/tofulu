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
        <div className="features-grid">
          <div 
            ref={(el) => (cardRefs.current[0] = el)}
            className={`feature-card ${visibleCards.includes(0) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Authentic TOEFL Experience</h3>
            <p className="feature-description">
              Experience the closest simulation to the actual TOEFL test with our carefully designed platform that mirrors the real exam environment.
            </p>
          </div>

          <div 
            ref={(el) => (cardRefs.current[1] = el)}
            className={`feature-card ${visibleCards.includes(1) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Affordable for Everyone</h3>
            <p className="feature-description">
              Start with our free sample tests and choose from flexible, budget-friendly plans designed to make TOEFL preparation accessible to all.
            </p>
          </div>

          <div 
            ref={(el) => (cardRefs.current[2] = el)}
            className={`feature-card ${visibleCards.includes(2) ? 'fade-in-visible' : 'fade-in-hidden'}`}
          >
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#086A6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-heading">Instant Grading & Reports</h3>
            <p className="feature-description">
              Get immediate feedback with AI-powered grading and detailed evaluation reports to track your progress and identify areas for improvement.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features

