export default ({ app }, inject) => {
  const hooks = [];

  const init = async hook => {
    if (hook) {
      hooks.push(hook);

      // Execute hook immediately in `spa` mode
      if (!app.context.nuxtState) {
        await hook();
      }

      return;
    }

    await Promise.all(hooks.map(hook => hook()));

    return;
  };

  inject('init', init);
};
