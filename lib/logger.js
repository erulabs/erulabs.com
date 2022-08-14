// @flow

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, label } = format
const { serializeError } = require('serialize-error')

const { PLAINTEXT_LOGGING, LOG_FILE, LOG_LEVEL, LOGGING_LABEL, APP_ENV } = require('../config')

/* flow-include
type Logger = {
  info: Function,
  debug: Function,
  error: Function,
  warn: Function,
  silly: Function,
  onlyInProduction: Function,
  onlyInDevelopment: Function
}
*/

let loggingFormat = combine(
  timestamp(),
  label({ app: LOGGING_LABEL, env: APP_ENV }),
  // $FlowIssue
  format.json({
    replacer: (key, value) => {
      if (value instanceof Buffer) {
        return value.toString('base64')
      } else if (value instanceof Error) {
        return serializeError(value)
      }
      return value
    },
  })
)
const loggingTransports = [new transports.Console()]

if (LOG_FILE) {
  loggingTransports.push(
    new transports.File({
      filename: LOG_FILE,
      level: LOG_LEVEL,
    })
  )
}

if (PLAINTEXT_LOGGING || process.env.NODE_ENV === 'development') {
  const logFormat = printf(info => {
    const c = Object.assign({}, info)
    delete c.level
    delete c.message
    delete c.timestamp
    function convertToJson(set) {
      for (const key in set) {
        if (set[key] && typeof set[key] === 'object' && typeof set[key].toJSON === 'function') {
          set[key] = set[key].toJSON()
        } else if (set[key] && Array.isArray(set[key])) {
          convertToJson(set[key])
        }
      }
    }
    if (c.event) {
      c._event = c.event
      delete c.event
    }
    convertToJson(c)
    // Pretty print objects
    let o = Object.keys(c).length > 0 ? JSON.stringify(serializeError(c), null, 2) : ''
    // If they're very small objects, let's ditch indentation/line-breaks
    if (o.length < 80) o = o.replace(/\n/g, ' ').replace(/\s\s+/g, ' ')
    return `${info.level}: ${info.message} ${o}`
  })
  loggingFormat = combine(format.colorize(), timestamp(), logFormat)
}

const logger /*: Logger */ = createLogger({
  level: LOG_LEVEL,
  format: loggingFormat,
  transports: loggingTransports,
  colorize: true,
  prettyPrint: true,
})

logger.onlyInProduction = function (loggerFunc /*: string */ = 'info') {
  Array.prototype.shift.apply(arguments)
  if (process.env.NODE_ENV !== 'development') logger[loggerFunc](...arguments)
}

logger.onlyInDevelopment = function (loggerFunc /*: string */ = 'info') {
  Array.prototype.shift.apply(arguments)
  if (process.env.NODE_ENV === 'development') logger[loggerFunc](...arguments)
}

module.exports = logger
