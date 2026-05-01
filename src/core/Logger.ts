import pino from 'pino';
import path from 'path';
import fs from 'fs';
import os from 'os';

const logDir = path.join(os.homedir(), '.singularity', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, pino.destination(path.join(logDir, 'singularity.log')));
