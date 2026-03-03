import assert from 'node:assert/strict'
import { it } from 'node:test'
import { createJournaldTransport, journaldSocket } from './journald-socket.js'

function createFakeSocket ({ connectError = null, sendError = null } = {}) {
  const events = {}
  return {
    events,
    connectedPath: null,
    sentPayload: null,
    sendCalls: 0,
    closed: false,
    on (event, callback) {
      events[event] = callback
    },
    connect (path, callback) {
      this.connectedPath = path
      callback?.(connectError)
    },
    send (payload, callback) {
      this.sentPayload = payload
      this.sendCalls += 1
      callback?.(sendError)
    },
    close () {
      this.closed = true
    },
    unref () {}
  }
}

it('falls back to the built-in socket factory when no override is supplied', () => {
  const transport = createJournaldTransport()

  assert.ok(transport === null || typeof transport.send === 'function')
})

it('establishes a journald socket and encodes payloads', () => {
  const socket = createFakeSocket()
  const transport = createJournaldTransport({ createSocket: () => socket })

  assert.ok(transport)
  assert.strictEqual(socket.connectedPath, '/run/systemd/journal/socket')

  transport.send({ foo: 'bar', baz: 'qux' })
  assert.strictEqual(socket.sendCalls, 1)
  assert.strictEqual(socket.sentPayload.toString(), 'foo=bar\nbaz=qux\n')
})

it('silently ignores send once cleanup runs after an error event', () => {
  const socket = createFakeSocket()
  const transport = createJournaldTransport({ createSocket: () => socket })

  socket.events.error?.(new Error('boom'))

  transport.send({ foo: 'bar' })
  assert.strictEqual(socket.sendCalls, 0)
  assert.strictEqual(socket.closed, true)
})

it('returns null when the socket factory throws', () => {
  const transport = createJournaldTransport({ createSocket: () => { throw new Error('failed') } })
  assert.strictEqual(transport, null)
})

it('exposes the same transport via journaldSocket.createTransport', () => {
  const socket = createFakeSocket()
  const createSocket = () => socket
  const transport = journaldSocket.createTransport({ createSocket })

  assert.ok(transport)
  assert.strictEqual(socket.connectedPath, '/run/systemd/journal/socket')
})

it('runs cleanup when connect reports an error', () => {
  const socket = createFakeSocket({ connectError: new Error('connect fail') })
  const transport = createJournaldTransport({ createSocket: () => socket })

  assert.ok(transport)
  assert.strictEqual(socket.closed, true)

  transport.send({ foo: 'bar' })
  assert.strictEqual(socket.sendCalls, 0)
})

it('runs cleanup when send reports an error', () => {
  const socket = createFakeSocket({ sendError: new Error('send fail') })
  const transport = createJournaldTransport({ createSocket: () => socket })

  transport.send({ foo: 'bar' })
  assert.strictEqual(socket.closed, true)
  assert.strictEqual(socket.sendCalls, 1)
})

it('safely ignores repeated cleanup calls', () => {
  const socket = createFakeSocket()
  const transport = createJournaldTransport({ createSocket: () => socket })

  socket.events.error?.(new Error('boom'))
  socket.events.error?.(new Error('boom again'))

  transport.send({ foo: 'bar' })
  assert.strictEqual(socket.closed, true)
  assert.strictEqual(socket.sendCalls, 0)
})
