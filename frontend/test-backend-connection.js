// Test script to check backend connection and sentiment API
// Run this in browser console to test backend connectivity

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4009"

console.log('🔍 Testing Backend Connection...')
console.log('Backend URL:', BACKEND_URL)

// Test 1: Health Check
async function testHealthCheck() {
  try {
    console.log('🏥 Testing health endpoint...')
    const response = await fetch(`${BACKEND_URL}/health`)
    
    if (response.ok) {
      const data = await response.text()
      console.log('✅ Health check passed:', data)
      return true
    } else {
      console.log('❌ Health check failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message)
    return false
  }
}

// Test 2: Sentiment API
async function testSentimentAPI() {
  try {
    console.log('🎭 Testing sentiment API...')
    const response = await fetch(`${BACKEND_URL}/api/detect-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auto_detect: true
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Sentiment API working:', data)
      return true
    } else {
      console.log('❌ Sentiment API failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Sentiment API error:', error.message)
    return false
  }
}

// Test 3: Generate Roadmap API
async function testRoadmapAPI() {
  try {
    console.log('🗺️ Testing roadmap API...')
    const response = await fetch(`${BACKEND_URL}/api/generate-roadmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: "Test Project",
        experienceLevel: 3,
        availableHours: "2",
        category: "software",
        youtubeUrl: "",
        userDescription: "Test description"
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Roadmap API working:', data.success)
      return true
    } else {
      console.log('❌ Roadmap API failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Roadmap API error:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting backend connection tests...\n')
  
  const healthOk = await testHealthCheck()
  console.log('')
  
  const sentimentOk = await testSentimentAPI()
  console.log('')
  
  const roadmapOk = await testRoadmapAPI()
  console.log('')
  
  // Summary
  console.log('📊 Test Results:')
  console.log(`Health Check: ${healthOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Sentiment API: ${sentimentOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Roadmap API: ${roadmapOk ? '✅ PASS' : '❌ FAIL'}`)
  
  if (healthOk && sentimentOk && roadmapOk) {
    console.log('\n🎉 All tests passed! Backend is working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Check backend server status.')
    console.log('💡 Make sure the backend is running on port 4009')
    console.log('💡 Check if there are any CORS issues')
  }
}

// Export functions for manual testing
window.testBackendConnection = runAllTests
window.testHealthCheck = testHealthCheck
window.testSentimentAPI = testSentimentAPI
window.testRoadmapAPI = testRoadmapAPI

console.log('✅ Test functions loaded!')
console.log('📝 Usage:')
console.log('  - testBackendConnection() - Run all tests')
console.log('  - testHealthCheck() - Test health endpoint only')
console.log('  - testSentimentAPI() - Test sentiment API only')
console.log('  - testRoadmapAPI() - Test roadmap API only') 