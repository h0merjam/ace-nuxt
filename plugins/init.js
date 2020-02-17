export default (context, inject) => {
  const hooks = [];

  const init = async hook => {
    if (hook) {
      hooks.push(hook);
      return;
    }

    await Promise.all(hooks.map(hook => hook()));
  };

  inject('init', init);
};
