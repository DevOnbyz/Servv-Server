const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize({level: true}),
    timestamp(),
    align(),
    printf((info) => `${info.level}: [${(info.timestamp)}] ${(info.message)?.trim()} ${(info.stack) ? info.stack : ''}`)
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger