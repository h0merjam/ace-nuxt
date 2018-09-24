import _ from 'lodash';
import Vue from 'vue';

export const state = () => ({
  posts: {},
});

export const getters = {
  // eslint-disable-next-line
  posts: (state, getters) => (params = {}) => _.sortBy(_.filter(state.posts, (post) => {
    if (params.tag) {
      return post.tags.indexOf(params.tag) > -1;
    }
    return true;
  }), 'created_time').reverse(),
};

export const mutations = {
  POSTS(state, posts) {
    posts.forEach((post) => {
      Vue.set(state.posts, post.id, post);
    });
  },
};

export const actions = {
  async fetchRecent({ commit }, params) {
    commit('POSTS', (await this.$axios.$get('social/instagram/get/users/self/media/recent', { params })).data);
  },
};
