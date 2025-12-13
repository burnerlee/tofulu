/**
 * Response tracking utility for storing user responses in a standardized format.
 * 
 * Format: {
 *   question_id: {
 *     type: "choice" | "text" | "audio_reference" | "choices",
 *     value: <response_value>
 *   }
 * }
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/**
 * Decode JWT token to get user email
 * @returns {string|null} User email or null if not found
 * @deprecated Use useUser hook from UserContext instead
 */
export function getUserEmailFromToken() {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return null
    }
    
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    
    // Try different possible email fields
    return payload.email || payload.sub || payload['cognito:username'] || null
  } catch (error) {
    console.error('Error decoding JWT token:', error)
    return null
  }
}

/**
 * Get test ID from localStorage (stored during test load)
 * @returns {string|null} Test ID or null if not found
 * @deprecated Use useUser hook from UserContext instead
 */
export function getTestIdFromStorage() {
  return localStorage.getItem('pending_test_id') || localStorage.getItem('test_id') || null
}

/**
 * Get presigned URL for uploading audio file to S3
 * @param {string} userEmail - User's email address
 * @param {string} testId - Test ID
 * @param {string} filename - Unique filename for the audio file
 * @returns {Promise<{presignedUrl: string, key: string}>}
 */
export async function getPresignedUploadUrl(userEmail, testId, filename) {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/tests/${testId}/upload-url`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: userEmail,
          filename: filename,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      presignedUrl: data.presigned_url,
      key: data.key,
      bucket: data.bucket || 'testino-test-responses',
    }
  } catch (error) {
    console.error('Error getting presigned upload URL:', error)
    throw error
  }
}

/**
 * Upload audio file to S3 using presigned URL
 * @param {Blob} audioBlob - Audio file blob
 * @param {string} presignedUrl - Presigned URL for upload
 * @returns {Promise<void>}
 */
export async function uploadAudioToS3(audioBlob, presignedUrl) {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: audioBlob,
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload audio: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error uploading audio to S3:', error)
    throw error
  }
}

/**
 * Format response based on question type
 * @param {string} questionId - Question ID
 * @param {any} rawAnswer - Raw answer value from component
 * @param {string} questionType - Type of question (bundle.type)
 * @returns {Object} Formatted response object
 */
export function formatResponse(questionId, rawAnswer, questionType) {
  // Handle null/undefined answers
  if (rawAnswer === null || rawAnswer === undefined) {
    return null
  }

  // Choice-based questions (single selection)
  const choiceQuestionTypes = [
    'passage',
    'notice',
    'post',
    'email',
    'bestresponse',
    'listenpassage',
  ]

  if (choiceQuestionTypes.includes(questionType)) {
    // rawAnswer is already the index (0, 1, 2, 3...)
    return {
      type: 'choice',
      value: rawAnswer,
    }
  }

  // Text-based questions
  const textQuestionTypes = [
    'emailwriting',
    'groupdiscussionwriting',
  ]

  if (textQuestionTypes.includes(questionType)) {
    return {
      type: 'text',
      value: rawAnswer, // Full text with formatting
    }
  }

  // BuildTheSentence - stores array of phrase indices (choices)
  if (questionType === 'buildthesentence') {
    // rawAnswer is an array of phrase indices for each blank
    if (Array.isArray(rawAnswer)) {
      return {
        type: 'choices',
        value: rawAnswer,
      }
    }
    // Fallback to empty array if not an array
    return {
      type: 'choices',
      value: [],
    }
  }

  // FillInQuestion - multiple answers (array of words)
  // Note: Each blank in FillInQuestion has its own question ID
  // For now, we store each answer as text. To get all answers as choices array,
  // we would need to collect all answers for the bundle (can be enhanced later)
  if (questionType === 'fillin') {
    // If it's already an array, store as choices
    if (Array.isArray(rawAnswer)) {
      return {
        type: 'choices',
        value: rawAnswer,
      }
    }
    // Single word answer - store as text
    // TODO: Could be enhanced to collect all fillin answers for the bundle as choices
    return {
      type: 'text',
      value: rawAnswer,
    }
  }

  // Audio questions - handled separately in components
  // Audio responses come pre-formatted as audio_reference objects
  if (questionType === 'listenandrepeat' || questionType === 'interviewerquestion') {
    // Audio responses are handled in the component itself and come pre-formatted
    if (rawAnswer && typeof rawAnswer === 'object' && rawAnswer.type === 'audio_reference') {
      return rawAnswer
    }
    // If not yet uploaded, return null (will be set when upload completes)
    return null
  }

  // Default: store as text
  return {
    type: 'text',
    value: String(rawAnswer),
  }
}

/**
 * Store formatted response in the responses object
 * @param {Object} currentResponses - Current responses object
 * @param {string} questionId - Question ID
 * @param {Object} formattedResponse - Formatted response object
 * @returns {Object} Updated responses object
 */
export function storeResponse(currentResponses, questionId, formattedResponse) {
  if (formattedResponse === null) {
    // Remove response if null
    const updated = { ...currentResponses }
    delete updated[questionId]
    return updated
  }

  return {
    ...currentResponses,
    [questionId]: formattedResponse,
  }
}

/**
 * Log all responses to console (for debugging)
 * @param {Object} responses - Responses object
 */
export function logResponses(responses) {
  console.log('=== User Responses ===')
  console.log(JSON.stringify(responses, null, 2))
  console.log('=====================')
}
