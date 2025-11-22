import { useRef, useEffect } from 'react'
import { useVolume } from '../contexts/VolumeContext'

/**
 * Hook that creates an audio element and automatically applies the current volume setting
 * @param {string} audioUrl - URL of the audio file
 * @returns {Object} - Audio element ref and helper functions
 */
export const useAudioWithVolume = (audioUrl) => {
  const audioRef = useRef(null)
  const { getVolumeDecimal, applyVolumeToAudio } = useVolume()

  // Create audio element with volume applied
  const createAudio = (url) => {
    if (!url) return null
    
    const audio = new Audio(url)
    audio.volume = getVolumeDecimal()
    audioRef.current = audio
    
    // Listen for volume changes and update this audio element
    const updateVolume = () => {
      if (audioRef.current) {
        audioRef.current.volume = getVolumeDecimal()
      }
    }
    
    // Store update function for cleanup
    audioRef.current._updateVolume = updateVolume
    
    return audio
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        if (audioRef.current._updateVolume) {
          delete audioRef.current._updateVolume
        }
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return {
    audioRef,
    createAudio,
    applyVolume: applyVolumeToAudio,
  }
}

