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
{"timestamp":"2025-02-15T00:00:00.000Z","level":"info","namespace":"api","message":"User login","args":[{"userId":"u-123"}]}
```

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
