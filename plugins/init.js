export default async (ctx, inject) => {
  const hooks = [];

  const init = async (hook) => {
    if (hook) {
      hooks.push(hook);

      if (process.static) {
        await hook();
      }

      return;
    }

    await Promise.all(hooks.map((hook) => hook()));

    return;
  };

  inject('init', init);
};
