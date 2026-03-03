import { createSocket } from 'node:dgram'

const JOURNAL_SOCKET_PATH = '/run/systemd/journal/socket'

function buildTransport (createSocketImplementation) {
  try {
    const socket = createSocketImplementation({ type: 'unix_dgram' })
    let activeSocket = socket

    const cleanup = () => {
      if (!activeSocket) return
      activeSocket.close()
      activeSocket = null
    }

    socket.on('error', cleanup)
    socket.on('close', cleanup)
    socket.connect(JOURNAL_SOCKET_PATH, (error) => {
      if (error) cleanup()
    })
    socket.unref?.()

    return {
      send (fields) {
        if (!activeSocket) return
        const payload = Buffer.from(
          Object.entries(fields).map(
            ([key, value]) => `${key}=${value}`).join('\n') + '\n')
        activeSocket.send(payload, (error) => {
          if (error) cleanup()
        })
      }
    }
  } catch (error) {
    throw error
  }
}

export function createJournaldTransport ({ createSocket: createSocketImplementation } = {}) {
  try {
    return buildTransport(createSocketImplementation ?? createSocket)
  } catch (error) {
    return null
  }
}

export const journaldSocket = {
  createTransport (options) {
    return createJournaldTransport(options)
  }
}
