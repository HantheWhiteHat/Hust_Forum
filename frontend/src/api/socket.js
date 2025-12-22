import { io } from 'socket.io-client'

let socketInstance = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Get or create a singleton socket instance with reconnection handling
 */
export const getSocket = () => {
  if (socketInstance?.connected) return socketInstance

  // If already exists but disconnected, don't recreate
  if (socketInstance) return socketInstance

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')

  socketInstance = io(baseUrl, {
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  })

  // Connection event handlers
  socketInstance.on('connect', () => {
    console.log('Socket connected:', socketInstance.id)
    reconnectAttempts = 0
  })

  socketInstance.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      socketInstance.connect()
    }
  })

  socketInstance.on('connect_error', (error) => {
    reconnectAttempts++
    console.warn(`Socket connection error (attempt ${reconnectAttempts}):`, error.message)

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Socket will not auto-reconnect.')
    }
  })

  socketInstance.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts')
    reconnectAttempts = 0
  })

  return socketInstance
}

/**
 * Close the socket connection and cleanup
 */
export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners()
    socketInstance.disconnect()
    socketInstance = null
    reconnectAttempts = 0
  }
}

/**
 * Check if socket is currently connected
 */
export const isSocketConnected = () => {
  return socketInstance?.connected ?? false
}

/**
 * Manually reconnect the socket
 */
export const reconnectSocket = () => {
  if (socketInstance && !socketInstance.connected) {
    reconnectAttempts = 0
    socketInstance.connect()
  }
}
