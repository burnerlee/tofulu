import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = '/og-image.png',
  type = 'website',
  noindex = false 
}) => {
  const location = useLocation()
  const baseUrl = 'https://testino.space' // Update with your actual domain
  const currentUrl = `${baseUrl}${location.pathname}`
  
  // Default values optimized for TOEFL keywords
  const defaultTitle = 'TOEFL Practice Tests & Exam Preparation - Testino | New Format 2026'
  const defaultDescription = 'Master the TOEFL exam with our comprehensive practice tests, mock exams, and exam preparation platform. Experience the new TOEFL format (2026) with authentic test simulations, instant AI grading, and detailed performance reports. Start your free TOEFL preparation today!'
  const defaultKeywords = 'TOEFL practice tests, TOEFL exam preparation, TOEFL mock tests, TOEFL new format, TOEFL practice tests new format, TOEFL 2026, TOEFL preparation platform, TOEFL online practice, TOEFL test simulation, TOEFL study guide'
  
  const seoTitle = title || defaultTitle
  const seoDescription = description || defaultDescription
  const seoKeywords = keywords || defaultKeywords
  const ogImage = image.startsWith('http') ? image : `${baseUrl}${image}`
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang Tags for Regional Targeting */}
      <link rel="alternate" hreflang="en" href={currentUrl} />
      <link rel="alternate" hreflang="en-US" href={currentUrl} />
      <link rel="alternate" hreflang="en-GB" href={currentUrl} />
      <link rel="alternate" hreflang="en-CA" href={currentUrl} />
      <link rel="alternate" hreflang="en-AU" href={currentUrl} />
      <link rel="alternate" hreflang="en-IN" href={currentUrl} />
      <link rel="alternate" hreflang="x-default" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Testino" />
      <meta property="og:locale" content="en_US" />
      
      {/* Additional Open Graph tags for better international targeting */}
      <meta property="og:locale:alternate" content="en_GB" />
      <meta property="og:locale:alternate" content="en_CA" />
      <meta property="og:locale:alternate" content="en_AU" />
      <meta property="og:locale:alternate" content="en_IN" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Testino",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "description": seoDescription,
          "sameAs": [
            // Add your social media URLs here when available
          ],
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free TOEFL practice tests and exam preparation"
          }
        })}
      </script>
      
      {/* Structured Data - WebSite */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Testino",
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
      
      {/* Structured Data - Course (for TOEFL preparation) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "TOEFL Exam Preparation",
          "description": "Comprehensive TOEFL practice tests and exam preparation for the new 2026 format",
          "provider": {
            "@type": "Organization",
            "name": "Testino",
            "url": baseUrl
          },
          "educationalLevel": "Professional",
          "courseCode": "TOEFL-2026",
          "keywords": seoKeywords
        })}
      </script>
    </Helmet>
  )
}

export default SEO

