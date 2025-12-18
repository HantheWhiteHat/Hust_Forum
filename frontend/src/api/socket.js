import { io } from 'socket.io-client'

let socketInstance

export const getSocket = () => {
  if (socketInstance) return socketInstance

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')

  socketInstance = io(baseUrl, {
    transports: ['websocket'],
    withCredentials: true,
  })

  return socketInstance
}

export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
