// Sistema de logging avanzado
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  userId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];

  private log(level: LogEntry['level'], message: string, context?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };

    this.logs.push(entry);
    
    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Aquí integrarías con servicios como Winston, DataDog, etc.
      console.log(JSON.stringify(entry));
    } else {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data || '');
    }
  }

  info(message: string, context?: Partial<LogEntry>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Partial<LogEntry>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Partial<LogEntry>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Partial<LogEntry>) {
    this.log('debug', message, context);
  }

  // Logging específico para acciones de usuarios
  userAction(action: string, userId: string, ip: string, data?: any) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ip,
      data
    });
  }

  // Logging de seguridad
  security(message: string, ip: string, data?: any) {
    this.warn(`Security: ${message}`, {
      action: 'security_event',
      ip,
      data
    });
  }

  // Obtener logs recientes (para dashboard)
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }
}

export const logger = new Logger();
