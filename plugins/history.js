class History {
  constructor() {
    return [];
  }
}

export default ({ app, store }, inject) => {
  const history = new History();

  inject('history', history);

  const userInteractionTimeout = 250;
  let isUserTriggeredNavigation = false;
  let disableBackNav = true;

  const isBackNav = (toState, fromState) => {
    if (app.$history.length < 2) {
      return false;
    }

    const prevState = app.$history[0];

    if (
      prevState.fullPath === toState.fullPath
      && fromState.fullPath.split('/').length > toState.fullPath.split('/').length
    ) {
      return true;
    }

    return false;
  };

  const interact = () => {
    isUserTriggeredNavigation = true;

    setTimeout(() => {
      isUserTriggeredNavigation = false;
    }, userInteractionTimeout);
  };

  if (process.client) {
    window.addEventListener('keydown', interact);
    window.addEventListener('mousedown', interact);
    window.addEventListener('touchstart', interact);

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
      if (disableBackNav && isUserTriggeredNavigation && isBackNav(to, from)) {
        disableBackNav = false;
        next(false);
        window.history.back();
        return;
      }

      disableBackNav = true;
      next();
    });
  }
};
