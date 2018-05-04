class History {
  constructor() {
    return [];
  }
}

export default ({ app, store }, inject) => {
  const history = new History();

  inject('history', history);

  let allowBackNav = false;

  const isBackNav = (prevState, toState, fromState) => {
    if (
      prevState.fullPath === toState.fullPath
      && fromState.fullPath.split('/').length > toState.fullPath.split('/').length
    ) {
      return true;
    }
    return false;
  };

  if (process.client) {
    app.router.afterEach((to, from) => {
      const state = {
        name: from.name,
        fullPath: from.fullPath,
        path: from.path,
        params: from.params,
        query: from.query,
        scrollY: window.scrollY,
      };

      app.$history.unshift(state);
      store.commit('HISTORY', state);
    });

    app.router.beforeEach((to, from, next) => {
      if (app.$history.length && isBackNav(app.$history[0], to, from) && !allowBackNav) {
        next(false);
        window.history.back();
        allowBackNav = true;
        return;
      }
      allowBackNav = false;
      next();
    });
  }
};
