import Vue from 'vue';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';

export const state = () => ({
  posts: {},
});

export const getters = {
  posts: state => (params = {}) =>
    sortBy(
      filter(state.posts, post => {
        if (params.tag) {
          return post.tags.indexOf(params.tag) > -1;
        }
        return true;
      }),
      'created_time'
    ).reverse(),
};

export const mutations = {
  POSTS(state, posts) {
    posts.forEach(post => {
      Vue.set(state.posts, post.id, post);
    });
  },
};

export const actions = {
  async fetchRecent({ commit }, params) {
    const result = await this.$axios.$get(
      'social/instagram/get/users/self/media/recent',
      { params }
    );
    commit('POSTS', result.data);
    return result.data;
  },
};
