import Helpers from 'ace-helpers';

export default ({ $config }, inject) => {
  const helpers = new Helpers({
    assistUrl: $config.ASSIST_URL,
    slug: $config.SLUG,
  });

  inject('helpers', helpers);

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
};
