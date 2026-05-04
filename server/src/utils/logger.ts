import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${message}${metaStr}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      process.env['NODE_ENV'] === 'production'
        ? combine(timestamp(), json())
        : combine(timestamp(), colorize(), devFormat),
  }),
];

if (process.env['NODE_ENV'] === 'production') {
  const logsDir = path.resolve(__dirname, '../../../logs');
  transports.push(
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: combine(timestamp(), json()),
    }),
  );
}

const logger = winston.createLogger({
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  transports,
});

export default logger;
