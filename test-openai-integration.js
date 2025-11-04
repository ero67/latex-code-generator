#!/usr/bin/env node

/**
 * Test script for OpenAI Vision API integration
 * Make sure to set your OPENAI_API_KEY in the backend/.env file first
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:3001/api/imagetolatex/generate';

async function testOpenAIIntegration() {
  console.log('🤖 Testing OpenAI Vision API Integration...\n');

  // Check if we have a test image
  const testImagePath = './test-image.png';
  if (!fs.existsSync(testImagePath)) {
    console.log('❌ Test image not found. Creating a simple test image...');
    // Create a simple 1x1 pixel PNG
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created');
  }

  try {
    // Test 1: Check if API key is configured
    console.log('Test 1: Checking API key configuration...');
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      formData.append('structureType', 'Karnaugh Map');
      
      const response = await axios.post(BACKEND_URL, formData, {
        headers: formData.getHeaders()
      });
      
      if (response.data.status === 'success') {
        console.log('✅ API key is configured and working!');
        console.log('📝 Generated LaTeX:', response.data.latex.substring(0, 100) + '...');
        console.log('🎯 Structure Type:', response.data.structureType);
        console.log('📊 Confidence:', response.data.confidence);
      } else {
        console.log('❌ Unexpected response:', response.data);
      }
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.message?.includes('API key')) {
        console.log('❌ OpenAI API key not configured');
        console.log('💡 Please set your OPENAI_API_KEY in backend/.env file');
      } else {
        console.log('❌ Error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Test different structure types
    console.log('\nTest 2: Testing different structure types...');
    const structureTypes = ['Karnaugh Map', 'Abstract Syntax Tree', 'Proof Tree'];
    
    for (const structureType of structureTypes) {
      try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));
        formData.append('structureType', structureType);
        
        const response = await axios.post(BACKEND_URL, formData, {
          headers: formData.getHeaders()
        });
        
        if (response.data.status === 'success') {
          console.log(`✅ ${structureType}: Success`);
          console.log(`   LaTeX preview: ${response.data.latex.substring(0, 50)}...`);
        } else {
          console.log(`❌ ${structureType}: Failed - ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ ${structureType}: Error - ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 3: Test unsupported structure type
    console.log('\nTest 3: Testing unsupported structure type...');
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      formData.append('structureType', 'Unsupported Type');
      
      await axios.post(BACKEND_URL, formData, {
        headers: formData.getHeaders()
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected unsupported structure type');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test script failed:', error.message);
  }

  // Cleanup
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 Cleaned up test image');
  }

  console.log('\n🏁 OpenAI integration test completed!');
  console.log('\nNext steps:');
  console.log('1. Set your OPENAI_API_KEY in backend/.env file');
  console.log('2. Rebuild the backend container: docker-compose up --build backend');
  console.log('3. Test the frontend at http://localhost:5173/image-to-latex');
}

// Check if backend is running
async function checkBackend() {
  try {
    await axios.get('http://localhost:3001/api/auth/login', { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if backend is running...');
  const backendRunning = await checkBackend();
  
  if (!backendRunning) {
    console.log('❌ Backend is not running on http://localhost:3001');
    console.log('Please start the backend first: docker-compose up backend');
    process.exit(1);
  }
  
  console.log('✅ Backend is running');
  await testOpenAIIntegration();
}

main().catch(console.error);
