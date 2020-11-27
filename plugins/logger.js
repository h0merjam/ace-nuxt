// import debugTrace from 'debug-trace';

// debugTrace({
//   always: true,
// });

// if (process.client) {
//   console.format = (c) => `[${c.getFileName()}:${c.getLineNumber()}] `;
// }

export default ({ $config }, inject) => {
  const log = {};
  const logLevel = parseInt($config.LOG_LEVEL || 0, 10);

  ['error', 'warn', 'info'].forEach((level, i) => {
    log[level] = i < logLevel ? console[level] : () => {};
  });

  inject('log', log);
};
