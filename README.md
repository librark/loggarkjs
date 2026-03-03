# loggark
Utilitarian Logging Library

## Logger output format

`Logger` now emits a single JSON object per log line by default (JSON Lines). This format is easier to consume with `journalctl` pipelines (`jq`, `grep`, field selection).

- Default: `format: 'json'`
- Backward compatibility: `format: 'plain'`
- Context flattening in JSON mode: `flat: true` (default)

Example:

```js
import { Logger } from '@knowark/loggarkjs'

const logger = new Logger({ namespace: 'api' })
logger.info('User login', { userId: 'u-123' })
```

Outputs:

```json
{"timestamp":"2025-02-15T00:00:00.000Z","level":"info","namespace":"api","message":"User login","userId":"u-123"}
```

Additional object parameters are merged into the base log object. If keys collide, later merged values overwrite earlier keys.

If you prefer context keys at top level (for simpler `jq` filters), enable flattening:

```js
const logger = new Logger({
  namespace: 'api',
  context: { correlationId: 'ABCD1234', interactor: 'Informer' },
  flat: true
})

logger.info('User login')
```

```json
{"timestamp":"2025-02-15T00:00:00.000Z","level":"info","namespace":"api","correlationId":"ABCD1234","interactor":"Informer","message":"User login"}
```

To keep nested context under `context`, disable flattening:

```js
const logger = new Logger({
  context: { correlationId: 'ABCD1234' },
  flat: false
})
```

## Journald integration

Set the boolean `globalThis.JOURNALD` flag to `true` and `Logger` will open `/run/systemd/journal/socket` for you. Every JSON record is translated into Journald fields (`PRIORITY`, `MESSAGE`, `LEVEL`, optional `SYSLOG_IDENTIFIER`, and uppercased context payloads), so you can pipe `logger.info()` calls directly into `journalctl` for centralized viewing.

```js
globalThis.JOURNALD = true
const logger = new Logger({ namespace: 'api' })

logger.info('User login', { userId: 'u-123', extra: undefined })
```

Undefined values are dropped, `null` turns into the string `'null'`, and functions/symbols are rendered so Journald receives a predictable payload. The socket connection is cached per process, so later `Logger` instances reuse the same transport without extra setup.
