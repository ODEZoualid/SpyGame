'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socketClient';
import { config } from '../config';

export default function TestPage() {
  const [socket, setSocket] = useState<any>(null);
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Attempting to connect to: ${config.SERVER_URL}`);
    console.log('SOCKET_USE site=TestPage time=', new Date().toISOString());
    const newSocket = getSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      addLog('✅ Connected to server');
      setStatus('Connected');
    });

    newSocket.on('connect_error', (error) => {
      addLog(`❌ Connection error: ${error.message}`);
      setStatus('Connection Error');
    });

    newSocket.on('disconnect', () => {
      addLog('🔌 Disconnected from server');
      setStatus('Disconnected');
    });

    newSocket.on('room-created', (data) => {
      addLog(`🏠 Room created: ${JSON.stringify(data)}`);
    });

    return () => {
      // Don't close the singleton socket, just remove listeners
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('room-created');
    };
  }, []);

  const testCreateRoom = () => {
    if (socket) {
      addLog('Testing room creation...');
      socket.emit('create-room', { nickname: 'Test User' });
    } else {
      addLog('❌ Socket not available');
    }
  };

  const testHealth = async () => {
    try {
      const response = await fetch(`${config.SERVER_URL}/api/health`);
      const data = await response.json();
      addLog(`🏥 Health check: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`❌ Health check failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Socket.IO Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${
              status === 'Connected' ? 'bg-green-500' : 
              status === 'Connection Error' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="font-medium">{status}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Server URL: {config.SERVER_URL}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testHealth}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Test Health Endpoint
            </button>
            <button
              onClick={testCreateRoom}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Test Create Room
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Logs</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
