import Vue from 'vue';
import _ from 'lodash';

// Custom serializer for Lambda
const paramsSerializer = (params) => {
  const paramsArray = [];

  _.forEach(params, (value, key) => {
    if (_.isArray(value)) {
      value.forEach((v, i) => {
        paramsArray.push(`${key}[${i}]=${v}`);
      });
    } else {
      paramsArray.push(`${key}=${value}`);
    }
  });

  return encodeURI(paramsArray.join('&'));
};

export const state = () => ({
  apiToken: '',
  metadata: {
    title: '',
    description: '',
  },
  device: {},
  misc: {},
  history: [],
  taxonomies: {},
  entities: {},
});

const setPayload = (state, map, payload) => {
  Object.keys(payload).forEach((key) => {
    Vue.set(state[map], key, payload[key]);
  });
};

export const mutations = {
  API_TOKEN(state, apiToken) {
    Vue.set(state, 'apiToken', apiToken);
  },
  METADATA(state, payload) {
    setPayload(state, 'metadata', payload);
  },
  DEVICE(state, payload) {
    setPayload(state, 'device', payload);
  },
  MISC(state, payload) {
    setPayload(state, 'misc', payload);
  },
  HISTORY(state, fromState) {
    state.history.unshift(fromState);
    Vue.set(state, 'history', state.history);
  },
  TAXONOMY(state, taxonomy) {
    Vue.set(state.taxonomies, taxonomy.slug, taxonomy);
  },
  ENTITY(state, entity) {
    if (!entity._id) {
      return;
    }
    Vue.set(state.entities, entity._id, _.merge(state.entities[entity._id] || {}, entity));
  },
  ENTITIES(state, entities) {
    entities = entities.rows || entities.docs || entities;
    entities.forEach((entity) => {
      entity = entity.doc || entity;
      if (!entity._id) {
        return;
      }
      Vue.set(state.entities, entity._id, _.merge(state.entities[entity._id] || {}, entity));
    });
  },
};

export const actions = {
  async fetchMetadata({ commit }) {
    const result = await this.$axios.$get('metadata');
    commit('METADATA', result);
    return result;
  },
  async fetchTaxonomy({ commit }, { slug }) {
    const result = await this.$axios.$get('taxonomy', { params: { slug } });
    commit('TAXONOMY', result);
    return result;
  },
  async fetchEntities({ commit }, { method, path, params, data }) {
    const result = await this.$axios.$request({
      url: path || 'entities',
      method: method || 'get',
      params,
      paramsSerializer,
      data,
    });
    commit('ENTITIES', result);
    return result;
  },
};
