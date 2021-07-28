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
    isScrolledUp: false,
    isScrolledDown: false,
    isTabbing: false,
    viewportWidth: 0,
    viewportHeight: 0,
    availableViewportHeight: 0,
    initialViewportHeight: 0,
  };

  /*
   ** User Agent
   */
  const ua = process.client
    ? window.navigator.userAgent
    : req && req.headers['user-agent'];

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
    availableViewportHeight: device.isMobile ? 667 : 768,
  };

  device.initialViewportHeight = device.availableViewportHeight;

  if (process.client) {
    const updateViewport = (event, initial = false) => {
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

          const availableViewportHeight =
            screen.height - (screen.height - window.innerHeight);

          if (initial) {
            document.documentElement.style.setProperty(
              '--initial-viewport-height',
              `${availableViewportHeight}px`
            );
          }

          document.documentElement.style.setProperty(
            '--available-viewport-height',
            `${availableViewportHeight}px`
          );

          store.commit('DEVICE', {
            isPortrait: device.isPortrait,
            isLandscape: device.isLandscape,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            availableViewportHeight,
            initialViewportHeight: initial
              ? availableViewportHeight
              : undefined,
          });
        },
        initial ? 0 : 100
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
    let scrollYPrev = 0;

    window.addEventListener('scroll', () => {
      device.isScrolled = window.scrollY > 0;
      device.isScrolledUp = window.scrollY < scrollYPrev;
      device.isScrolledDown = window.scrollY > scrollYPrev;

      if (store.state.device.isScrolled !== device.isScrolled) {
        store.commit('DEVICE', { isScrolled: device.isScrolled });

        document.documentElement.classList[
          device.isScrolled ? 'add' : 'remove'
        ]('scrolled');
      }

      if (store.state.device.isScrolledUp !== device.isScrolledUp) {
        store.commit('DEVICE', { isScrolledUp: device.isScrolledUp });

        document.documentElement.classList[
          device.isScrolledUp ? 'add' : 'remove'
        ]('scrolled-up');
      }

      if (store.state.device.isScrolledDown !== device.isScrolledDown) {
        store.commit('DEVICE', { isScrolledDown: device.isScrolledDown });

        document.documentElement.classList[
          device.isScrolledDown ? 'add' : 'remove'
        ]('scrolled-down');
      }

      scrollYPrev = window.scrollY;
    });
  }

  /*
   ** Tabbing
   */
  if (process.client) {
    document.addEventListener('keydown', (event) => {
      if (!device.isTabbing && (event.key === 'Tab' || event.keyCode === 9)) {
        device.isTabbing = true;

        document.documentElement.classList.add('tabbing');

        store.commit('DEVICE', { isTabbing: device.isTabbing });
      }
    });
    document.addEventListener('mousedown', () => {
      if (device.isTabbing) {
        device.isTabbing = false;

        document.documentElement.classList.remove('tabbing');

        store.commit('DEVICE', { isTabbing: device.isTabbing });
      }
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

  if (process.client) {
    store.commit('USERAGENT', userAgent);
    store.commit('DEVICE', device);
  }
};
