/* eslint no-restricted-globals: 0 */

import UAParser from 'ua-parser-js';
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

  const userAgent = UAParser(ua);
  const md = new MobileDetect(ua);

  /*
  ** User Agent
  */
  store.commit('USERAGENT', userAgent);

  /*
  ** Device Type
  */
  store.commit('DEVICE', {
    isMobile: !!md.mobile(),
    isTablet: !!md.tablet(),
    isDesktop: !!(!md.mobile() && !md.tablet()),
  });
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
        store.commit('DEVICE', { isPortrait });
        if (init) {
          document.documentElement.style.setProperty('--init-vh', `${availableHeight}px`);
        }
        document.documentElement.style.setProperty('--vh', `${availableHeight}px`);
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
};
