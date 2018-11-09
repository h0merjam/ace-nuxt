import Helpers from 'ace-helpers/index.es6';

export default ({ env }, inject) => {
  const helpers = new Helpers({
    assistUrl: env.ASSIST_URL,
    slug: env.SLUG,
  });

  inject('helpers', helpers);
};
