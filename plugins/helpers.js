/* eslint no-restricted-globals: 0 */

import MobileDetect from 'mobile-detect';
import Helpers from 'ace-helpers/index.es6';

if (process.client) {
  // eslint-disable-next-line
  require('feature.js');
}

export default ({ store, req }, inject) => {
  const helpers = new Helpers({
    assistUrl: process.env.assistUrl,
    slug: process.env.slug,
  });

  inject('helpers', helpers);

  const ua = process.client ? window.navigator.userAgent : req.headers['user-agent'];
  const md = new MobileDetect(ua);

  /*
  ** Device Type
  */
  store.commit('DEVICE', { isMobile: !!md.mobile() });
  if (process.client) {
    if (md.mobile()) {
      document.documentElement.classList.add('mobile');
    }
  }

  /*
  ** Window Loaded
  */
  if (process.client) {
    window.addEventListener('load', () => {
      store.commit('DEVICE', { isLoaded: true });
      document.documentElement.classList.add('loaded');
    }, { once: true });
  }

  /*
  ** Viewport Dimensions
  */
  if (process.client) {
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

  /*
  ** Tabbing
  */
  if (process.client) {
    document.addEventListener('keydown', (event) => {
      if (event.keyCode === 9) {
        document.documentElement.classList.add('tabbed');
      }
    });
    document.addEventListener('mousedown', () => {
      document.documentElement.classList.remove('tabbed');
    });
  }
};
