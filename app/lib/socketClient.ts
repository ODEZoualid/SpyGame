import { io, Socket } from 'socket.io-client';
import { config } from '../config';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be created on the client side');
  }

  if (!socketInstance) {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || config.SERVER_URL;
    socketInstance = io(serverUrl);
    console.log('SOCKET_SINGLETON_INIT', { 
      url: serverUrl, 
      socketId: socketInstance?.id || null,
      timestamp: new Date().toISOString()
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('SOCKET_SINGLETON_DISCONNECT', { timestamp: new Date().toISOString() });
  }
}
