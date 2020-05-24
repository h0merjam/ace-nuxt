import debugTrace from 'debug-trace';

debugTrace({
  always: true,
});

if (process.client) {
  console.format = (c) => `[${c.getFileName()}:${c.getLineNumber()}] `;
}

export default ({ env }, inject) => {
  env = Object.assign(
    {
      LOG_LEVEL: 0,
    },
    env
  );

  const log = {};
  const logLevel = parseInt(env.LOG_LEVEL, 10);

  ['error', 'warn', 'info'].forEach((level, i) => {
    log[level] = i < logLevel ? console[level] : () => {};
  });

  inject('log', log);
};
