/* eslint no-restricted-globals: 0 */

import UAParser from 'ua-parser-js';
import MobileDetect from 'mobile-detect';

if (process.client) {
  // eslint-disable-next-line
  require('feature.js');
}

export default ({ app, store, req }, inject) => {
  /*
  ** User Agent
  */
  const userAgent = process.client ? window.navigator.userAgent : req.headers['user-agent'];

  /*
  ** Device Type
  */
  const md = new MobileDetect(userAgent);

  if (process.client) {
    if (md.mobile()) {
      document.documentElement.classList.add('mobile');
    }
    if (md.tablet()) {
      document.documentElement.classList.add('tablet');
    }
    if (!md.mobile() && !md.tablet()) {
      document.documentElement.classList.add('desktop');
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
    const setViewportVars = (event, init = false) => {
      setTimeout(() => {
        const availableHeight = screen.height - (screen.height - window.innerHeight);
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        store.commit('DEVICE', { isPortrait, isLandscape: !isPortrait });
        if (init) {
          document.documentElement.style.setProperty('--ah-init', `${availableHeight}px`);
        }
        document.documentElement.style.setProperty('--ah', `${availableHeight}px`);
      }, 100);
    };

    setViewportVars(null, true);

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

  /*
  ** Scroll
  */
  inject('scrollTo', (selector, { block, behavior } = { block: 'start', behavior: 'smooth' }) => {
    document.querySelector(selector).scrollIntoView({ block, behavior });
  });

  app.$init(() => {
    /*
    ** User Agent
    */
    store.commit('USERAGENT', UAParser(userAgent));

    /*
    ** Device Type
    */
    store.commit('DEVICE', {
      isMobile: !!md.mobile(),
      isTablet: !!md.tablet(),
      isDesktop: !!(!md.mobile() && !md.tablet()),
    });
  });
};
