const fetch = require('node-fetch');

async function testRoomCreation() {
  try {
    console.log('Testing room creation...');
    
    // Test health endpoint
    const healthResponse = await fetch('https://spygame-production-9c1e.up.railway.app/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test a specific room code (replace with a real one)
    const roomCode = '123456'; // Replace with actual room code
    const roomResponse = await fetch(`https://spygame-production-9c1e.up.railway.app/api/rooms/${roomCode}`);
    const roomData = await roomResponse.json();
    console.log('Room check:', roomData);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRoomCreation();
