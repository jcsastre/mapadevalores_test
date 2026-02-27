// Server-side structured logger with ANSI colors
// Usage: const log = createLogger('module-name')
//        log.info('message', { key: value })

const R  = '\x1b[0m';   // reset
const DIM = '\x1b[2m';
const B  = '\x1b[1m';   // bold
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YLW = '\x1b[33m';
const BLU = '\x1b[34m';
const MAG = '\x1b[35m';
const CYN = '\x1b[36m';
const GRY = '\x1b[90m';

type Level = 'info' | 'warn' | 'error' | 'debug';
export type Ctx = Record<string, string | number | boolean | null | undefined>;

const LEVELS: Record<Level, { label: string; color: string; fn: 'log' | 'warn' | 'error' }> = {
  info:  { label: 'INFO ', color: GRN,       fn: 'log'   },
  warn:  { label: 'WARN ', color: YLW,       fn: 'warn'  },
  error: { label: 'ERROR', color: `${B}${RED}`, fn: 'error' },
  debug: { label: 'DEBUG', color: GRY,       fn: 'log'   },
};

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function formatCtx(ctx: Ctx): string {
  return Object.entries(ctx)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${CYN}${k}${GRY}=${R}${v}`)
    .join(`  ${GRY}│${R}  `);
}

function emit(level: Level, module: string, message: string, ctx: Ctx = {}): void {
  const { label, color, fn } = LEVELS[level];
  const ctxStr = Object.keys(ctx).length > 0 ? `  ${GRY}·${R}  ${formatCtx(ctx)}` : '';
  const line = [
    `${DIM}${ts()}${R}`,
    `${B}${color}${label}${R}`,
    `${MAG}[${module}]${R}`,
    `${message}${ctxStr}`,
  ].join('  ');
  console[fn](line);
}

export interface Logger {
  info (msg: string, ctx?: Ctx): void;
  warn (msg: string, ctx?: Ctx): void;
  error(msg: string, ctx?: Ctx): void;
  debug(msg: string, ctx?: Ctx): void;
  /** Returns a function that, when called, logs msg with elapsed ms appended to ctx */
  time (msg: string, ctx?: Ctx): () => void;
}

export function createLogger(module: string): Logger {
  return {
    info (msg, ctx) { emit('info',  module, msg, ctx); },
    warn (msg, ctx) { emit('warn',  module, msg, ctx); },
    error(msg, ctx) { emit('error', module, msg, ctx); },
    debug(msg, ctx) { emit('debug', module, msg, ctx); },
    time (msg, ctx) {
      const t0 = Date.now();
      return () => emit('info', module, msg, { ...ctx, ms: Date.now() - t0 });
    },
  };
}

// Convenience: log HTTP response at the end of a route
export function logResponse(
  log: Logger,
  status: number,
  msg: string,
  ctx?: Ctx,
): void {
  const ok = status < 400;
  if (ok) {
    log.info(`${BLU}${status}${R} ${msg}`, ctx);
  } else if (status < 500) {
    log.warn(`${YLW}${status}${R} ${msg}`, ctx);
  } else {
    log.error(`${RED}${status}${R} ${msg}`, ctx);
  }
}
