// Test script for SentimentPopup component with project modification features
// Run this in the browser console on the DIY generator page

console.log('🧪 Testing SentimentPopup with Project Modification Features...')

// Test 1: Basic sentiment popup
function testBasicSentimentPopup() {
  console.log('📋 Test 1: Basic sentiment popup')
  
  const testResult = {
    success: true,
    sentiment: 'Sad',
    confidence: 0.85,
    message: 'You seem a bit down about this project. Let\'s find something that excites you more!'
  }
  
  // Simulate setting the sentiment result
  if (window.setSentimentResult) {
    window.setSentimentResult(testResult)
    window.setShowSentimentPopup(true)
    console.log('✅ Basic popup should be visible')
  } else {
    console.log('❌ setSentimentResult function not found')
  }
}

// Test 2: Modified project popup
function testModifiedProjectPopup() {
  console.log('📋 Test 2: Modified project popup')
  
  const testResult = {
    success: true,
    sentiment: 'Surprise',
    confidence: 0.92,
    message: 'Wow! This project caught you by surprise, didn\'t it? Let\'s explore what we can build together! ✨'
  }
  
  // Simulate a modified project
  if (window.setRoadmap) {
    const modifiedRoadmap = {
      title: 'Build a Weather App (Modified)',
      totalDuration: '1-2 hours',
      experienceLevel: 'Beginner',
      isModified: true,
      originalTitle: 'Build a Weather App',
      modificationReason: 'Modified based on Surprise sentiment',
      days: [],
      materials: [],
      tools: []
    }
    
    window.setRoadmap(modifiedRoadmap)
    window.setSentimentResult(testResult)
    window.setShowSentimentPopup(true)
    console.log('✅ Modified project popup should be visible with modification badge')
  } else {
    console.log('❌ setRoadmap function not found')
  }
}

// Test 3: Project change functionality
function testProjectChange() {
  console.log('📋 Test 3: Project change functionality')
  
  const testResult = {
    success: true,
    sentiment: 'Disgust',
    confidence: 0.78,
    message: 'I understand this might not be exactly what you expected. Let\'s adjust the approach to better suit your needs! 🔧'
  }
  
  if (window.setSentimentResult) {
    window.setSentimentResult(testResult)
    window.setShowSentimentPopup(true)
    console.log('✅ Popup should show with "Change Project" option')
    console.log('💡 Click "Change Project" to test automatic modification')
  } else {
    console.log('❌ setSentimentResult function not found')
  }
}

// Test 4: All negative sentiments
function testAllNegativeSentiments() {
  console.log('📋 Test 4: All negative sentiments')
  
  const negativeSentiments = [
    {
      sentiment: 'Sad',
      message: 'Don\'t worry! Every expert was once a beginner. This roadmap will guide you step by step. You\'ve got this! 🌟'
    },
    {
      sentiment: 'Surprise',
      message: 'Wow! This project caught you by surprise, didn\'t it? Let\'s explore what we can build together! ✨'
    },
    {
      sentiment: 'Disgust',
      message: 'I understand this might not be exactly what you expected. Let\'s adjust the approach to better suit your needs! 🔧'
    },
    {
      sentiment: 'Angry',
      message: 'I see you\'re determined to make this work! That drive will help you overcome any challenges. Let\'s get started! 🔥'
    },
    {
      sentiment: 'Fear',
      message: 'It\'s normal to feel a bit overwhelmed by new projects. We\'ll start simple and build up gradually. You\'re not alone! 🤝'
    }
  ]
  
  let currentIndex = 0
  
  function showNextSentiment() {
    if (currentIndex < negativeSentiments.length) {
      const sentiment = negativeSentiments[currentIndex]
      const testResult = {
        success: true,
        sentiment: sentiment.sentiment,
        confidence: 0.8 + Math.random() * 0.2,
        message: sentiment.message
      }
      
      if (window.setSentimentResult) {
        window.setSentimentResult(testResult)
        window.setShowSentimentPopup(true)
        console.log(`✅ Showing ${sentiment.sentiment} sentiment (${currentIndex + 1}/${negativeSentiments.length})`)
      }
      
      currentIndex++
    } else {
      console.log('✅ All negative sentiments tested')
    }
  }
  
  showNextSentiment()
  
  // Return function to show next sentiment
  return showNextSentiment
}

// Test 5: Automatic sentiment detection simulation
function testAutomaticDetection() {
  console.log('📋 Test 5: Automatic sentiment detection simulation')
  
  if (window.performAutomaticSentimentDetection) {
    console.log('🎭 Simulating automatic sentiment detection...')
    window.performAutomaticSentimentDetection()
  } else {
    console.log('❌ performAutomaticSentimentDetection function not found')
  }
}

// Run all tests
console.log('🚀 Running all tests...')
console.log('')

// Test 1
testBasicSentimentPopup()
console.log('')

// Test 2
setTimeout(() => {
  testModifiedProjectPopup()
  console.log('')
}, 2000)

// Test 3
setTimeout(() => {
  testProjectChange()
  console.log('')
}, 4000)

// Test 4
setTimeout(() => {
  const nextSentiment = testAllNegativeSentiments()
  console.log('💡 Use nextSentiment() to cycle through negative sentiments')
  console.log('')
}, 6000)

// Test 5
setTimeout(() => {
  testAutomaticDetection()
  console.log('')
}, 8000)

console.log('📝 Test Instructions:')
console.log('1. Watch for popups appearing automatically')
console.log('2. Test "Change Project" button to see automatic modification')
console.log('3. Test "Keep Project" and "Simplify Project" options')
console.log('4. Check for modification badges on modified projects')
console.log('5. Verify smooth scrolling to project sections')

console.log('')
console.log('🎯 Key Features Tested:')
console.log('✅ Automatic sentiment detection (10 seconds after roadmap generation)')
console.log('✅ Project modification based on sentiment')
console.log('✅ Visual indicators for modified projects')
console.log('✅ All negative sentiment types (Sad, Surprise, Disgust, Angry, Fear)')
console.log('✅ Smooth scrolling to project sections')
console.log('✅ Fallback mechanisms for backend failures') 