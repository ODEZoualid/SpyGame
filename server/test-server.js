const io = require('socket.io-client');

// Test server connection
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Test creating a room
  socket.emit('create-room', { nickname: 'Test Host' });
});

socket.on('room-created', (data) => {
  console.log('✅ Room created:', data.roomCode);
  
  // Test joining the room
  const joinSocket = io('http://localhost:3001');
  joinSocket.emit('join-room', { roomCode: data.roomCode, nickname: 'Test Player' });
  
  joinSocket.on('join-success', (joinData) => {
    console.log('✅ Player joined:', joinData);
    process.exit(0);
  });
  
  joinSocket.on('join-error', (error) => {
    console.error('❌ Join error:', error);
    process.exit(1);
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timeout');
  process.exit(1);
}, 10000);
