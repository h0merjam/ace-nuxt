import debugTrace from 'debug-trace';

const LOG_LEVEL = process.env.LOG_LEVEL || 0;

debugTrace({
  always: true,
});

if (process.client) {
  console.format = c => `[${c.getFileName()}:${c.getLineNumber()}] `;
}

export default (context, inject) => {
  const log = {};
  const logLevel = parseInt(LOG_LEVEL, 10);

  ['error', 'warn', 'info'].forEach((level, i) => {
    log[level] = i < logLevel ? console[level] : () => {};
  });

  inject('log', log);
};
