import _ from 'lodash';
import Vue from 'vue';

export const state = () => ({
  posts: {},
});

export const getters = {
  // eslint-disable-next-line
  posts: (state, getters) => params => _.sortBy(_.filter(state.posts, (post) => {
    return true;
  }), 'created_time').reverse(),
};

export const mutations = {
  RECENT(state, recent) {
    recent.data.forEach((post) => {
      Vue.set(state.posts, post.id, post);
    });
  },
};

export const actions = {
  async fetchRecent({ commit }, params) {
    commit('RECENT', await this.$axios.$get('social/instagram/get/users/self/media/recent', { params }));
  },
};
