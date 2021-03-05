import { kebabCase } from 'lodash';
import UAParser from 'ua-parser-js';
import MobileDetect from 'mobile-detect';

if (process.client) {
  window.feature = require('feature.js');
}

export default ({ app, store, req }, inject) => {
  let device = {
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLoaded: false,
    isPortrait: false,
    isLandscape: false,
    isScrolled: false,
    isTabbing: false,
    viewportWidth: 0,
    viewportHeight: 0,
    availableHeight: 0,
  };

  /*
   ** User Agent
   */
  const ua = process.client
    ? window.navigator.userAgent
    : req.headers['user-agent'];

  const userAgent = UAParser(ua);

  if (process.client) {
    document.documentElement.classList.add(kebabCase(userAgent.browser.name));
    document.documentElement.classList.add(kebabCase(userAgent.os.name));
  }

  /*
   ** Type
   */
  const md = new MobileDetect(ua);

  device = {
    ...device,
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

  /*
   ** Loaded
   */
  if (process.client) {
    window.addEventListener(
      'load',
      () => {
        device.isLoaded = true;

        document.documentElement.classList.add('loaded');

        store.commit('DEVICE', { isLoaded: true });
      },
      { once: true }
    );
  }

  /*
   ** Viewport
   */
  device = {
    ...device,
    isPortrait: device.isMobile,
    isLandscape: device.isDesktop,
    viewportWidth: device.isMobile ? 375 : 1024,
    viewportHeight: device.isMobile ? 667 : 768,
    availableHeight: device.isMobile ? 667 : 768,
  };

  if (process.client) {
    const updateViewport = (event, init = false) => {
      setTimeout(
        () => {
          device.isPortrait = window.matchMedia(
            '(orientation: portrait)'
          ).matches;
          device.isLandscape = !device.isPortrait;

          document.documentElement.classList[
            device.isPortrait ? 'add' : 'remove'
          ]('portrait');
          document.documentElement.classList[
            device.isLandscape ? 'add' : 'remove'
          ]('landscape');

          const availableHeight =
            screen.height - (screen.height - window.innerHeight);

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

          store.commit('DEVICE', {
            isPortrait: device.isPortrait,
            isLandscape: device.isLandscape,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            availableHeight,
          });
        },
        init ? 0 : 100
      );
    };

    updateViewport(null, true);

    window.addEventListener('orientationchange', updateViewport);
    window.addEventListener('resize', updateViewport);
  }

  /*
   ** Scrolled
   */
  if (process.client) {
    window.addEventListener('scroll', () => {
      device.isScrolled = window.scrollY > 0;

      document.documentElement.classList[device.isScrolled ? 'add' : 'remove'](
        'scrolled'
      );

      if (store.state.device.isScrolled !== device.isScrolled) {
        store.commit('DEVICE', { isScrolled: device.isScrolled });
      }
    });
  }

  /*
   ** Tabbing
   */
  if (process.client) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' || event.keyCode === 9) {
        device.isTabbing = true;

        document.documentElement.classList.add('tabbing');

        store.commit('DEVICE', { isTabbing: device.isTabbing });
      }
    });
    document.addEventListener('mousedown', () => {
      device.isTabbing = false;

      document.documentElement.classList.remove('tabbing');

      store.commit('DEVICE', { isTabbing: device.isTabbing });
    });
  }

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
