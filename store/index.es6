import Vue from 'vue';
import { forEach, isArray, merge } from 'lodash';

const nuxtServerInit = async ({ commit }, { app }) => {
  commit('RESET');

  if (app.$init) {
    await app.$init();
  }
};

// Custom serializer for Lambda
const paramsSerializer = (params) => {
  const paramsArray = [];

  forEach(params, (value, key) => {
    if (isArray(value)) {
      value.forEach((v, i) => {
        paramsArray.push(`${key}[${i}]=${v}`);
      });
    } else {
      paramsArray.push(`${key}=${value}`);
    }
  });

  return encodeURI(paramsArray.join('&'));
};

const setPayload = (state, map, payload) => {
  state[map] = Object.assign({}, state[map], payload);
};

const initialState = () => ({
  role: 'guest',
  config: {},
  metadata: {
    title: '',
    description: '',
  },
  userAgent: {},
  device: {},
  misc: {},
  history: [],
  taxonomies: {},
  entities: {},
});

export const state = () => initialState();

export const mutations = {
  RESET(state) {
    Object.assign(state, initialState());
  },
  ROLE(state, role) {
    Vue.set(state, 'role', role);
  },
  CONFIG(state, config) {
    Vue.set(state, 'config', config);
  },
  METADATA(state, payload) {
    setPayload(state, 'metadata', payload);
  },
  USERAGENT(state, payload) {
    setPayload(state, 'userAgent', payload);
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
    Vue.set(state.entities, entity._id, merge(state.entities[entity._id] || {}, entity));
  },
  ENTITIES(state, entities) {
    entities = entities.rows || entities.docs || entities;
    entities.forEach((entity) => {
      let id;
      if (entity._id) {
        id = entity._id;
      } else {
        id = entity.id;
        entity = entity.doc || entity.fields || entity;
        id = entity._id || id;
      }
      if (!id) {
        return;
      }
      Vue.set(state.entities, id, merge(state.entities[id] || {}, entity));
    });
  },
};

export const actions = {
  nuxtServerInit,
  async fetchConfig({ commit }) {
    const result = await this.$axios.$get('config');
    commit('CONFIG', result);
    return result;
  },
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
