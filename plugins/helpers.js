import Helpers from 'ace-helpers';

export default ({ env }, inject) => {
  const helpers = new Helpers({
    assistUrl: env.ASSIST_URL,
    slug: env.SLUG,
  });

  inject('helpers', helpers);
};
