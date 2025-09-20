import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    // Return a dummy socket for server-side rendering
    console.warn('Attempted to get socket on server-side. Returning dummy socket.');
    return {} as Socket;
  }

  if (!socket) {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://backend-production-357c.up.railway.app';
    console.log('SOCKET_INIT serverUrl=', serverUrl, 'timestamp=', new Date().toISOString());
    
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: true
    });
    
    socket.on('connect', () => {
      console.log('SOCKET_CONNECT timestamp=', new Date().toISOString());
    });
    
    socket.on('disconnect', (reason) => {
      console.log('SOCKET_DISCONNECT reason=', reason, 'timestamp=', new Date().toISOString());
    });
    
    socket.on('connect_error', (error) => {
      console.error('SOCKET_CONNECT_ERROR error=', error, 'timestamp=', new Date().toISOString());
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('SOCKET_DISCONNECT_MANUAL timestamp=', new Date().toISOString());
    socket.disconnect();
    socket = null;
  }
};
