/* eslint no-restricted-globals: 0 */

import Vue from 'vue';
import MobileDetect from 'mobile-detect';
import Helpers from 'ace-helpers';

if (process.client) {
  // eslint-disable-next-line
  require('feature.js');
}

const config = {
  assistUrl: process.env.assistUrl,
  slug: process.env.slug,
};

const helpers = new Helpers(config);

Vue.use((Vue) => {
  Vue.prototype.$helpers = helpers;
});

export default ({ app, store, req }) => {
  app.$helpers = helpers;

  const ua = process.client ? window.navigator.userAgent : req.headers['user-agent'];

  const md = new MobileDetect(ua);

  store.commit('DEVICE', { isMobile: !!md.mobile() });

  if (process.client) {
    if (md.mobile()) {
      document.documentElement.classList.add('mobile');
    }

    window.addEventListener('load', () => {
      store.commit('DEVICE', { isLoaded: true });
      document.documentElement.classList.add('loaded');
    }, { once: true });

    const setViewportVars = () => {
      setTimeout(() => {
        const availableHeight = screen.height - (screen.height - window.innerHeight);
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        store.commit('DEVICE', { isPortrait });
        document.documentElement.style.setProperty('--vh', `${availableHeight}px`);
      }, 100);
    };

    setViewportVars();

    window.addEventListener('orientationchange', setViewportVars);
    window.addEventListener('resize', setViewportVars);
  }
};
