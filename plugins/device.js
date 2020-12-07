import { kebabCase } from 'lodash';
import UAParser from 'ua-parser-js';
import MobileDetect from 'mobile-detect';

if (process.client) {
  require('feature.js');
}

export default ({ app, store, req }, inject) => {
  let userAgent = {};
  let device = {};

  if (process.client || !process.static) {
    /*
     ** User Agent
     */
    const ua = process.client
      ? window.navigator.userAgent
      : req.headers['user-agent'];

    userAgent = UAParser(ua);

    if (process.client) {
      document.documentElement.classList.add(kebabCase(userAgent.browser.name));
      document.documentElement.classList.add(kebabCase(userAgent.os.name));
    }

    /*
     ** Device Type
     */
    const md = new MobileDetect(ua);

    device = {
      isMobile: !!md.mobile(),
      isTablet: !!md.tablet(),
      isDesktop: !!(!md.mobile() && !md.tablet()),
    };

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
  }

  /*
   ** Window Loaded
   */
  if (process.client) {
    window.addEventListener(
      'load',
      () => {
        store.commit('DEVICE', { isLoaded: true });
        document.documentElement.classList.add('loaded');
      },
      { once: true }
    );
  }

  /*
   ** Viewport Dimensions
   */
  if (process.client) {
    const setViewportVars = (event, init = false) => {
      setTimeout(() => {
        const availableHeight =
          screen.height - (screen.height - window.innerHeight);
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        store.commit('DEVICE', { isPortrait, isLandscape: !isPortrait });
        if (init) {
          document.documentElement.style.setProperty(
            '--ah-init',
            `${availableHeight}px`
          );
        }
        document.documentElement.style.setProperty(
          '--ah',
          `${availableHeight}px`
        );
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
      if (event.key === 'Tab' || event.keyCode === 9) {
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
  inject(
    'scrollTo',
    (
      selector,
      { block, behavior } = { block: 'start', behavior: 'smooth' }
    ) => {
      const scrollToElement = document.querySelector(selector);

      if (!scrollToElement) {
        console.error('[$scrollTo]', `Element not found '${selector}'`);
        return;
      }

      scrollToElement.scrollIntoView({ block, behavior });
    }
  );

  /*
   ** Inject
   */
  inject('userAgent', userAgent);
  inject('device', device);

  app.$init(() => {
    store.commit('USERAGENT', userAgent);
    store.commit('DEVICE', device);
  });
};
