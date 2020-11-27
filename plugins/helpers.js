import Helpers from 'ace-helpers';

export default ({ $config }, inject) => {
  const helpers = new Helpers({
    assistUrl: $config.ASSIST_URL,
    slug: $config.SLUG,
  });

  inject('helpers', helpers);
};
