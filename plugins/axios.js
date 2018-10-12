import hash from 'object-hash';
import sizeof from 'object-sizeof';
import lruCache from 'lru-cache';

const CACHE_ENABLED = process.env.CACHE_ENABLED || true;
const CACHE_MAX_AGE = process.env.CACHE_MAX_AGE || 30 * 60 * 1000;
const CACHE_MAX_SIZE = process.env.CACHE_MAX_SIZE || 128 * 1000 * 1000;

const cache = lruCache({
  maxAge: CACHE_MAX_AGE,
  max: CACHE_MAX_SIZE,
  length: item => sizeof(item),
});

const getCacheKey = config => hash({
  method: config.method,
  url: config.url.replace(config.baseURL, ''),
  params: config.params,
  headers: config.headers,
  data: config.data,
});

export default ({ $axios, store }) => {
  $axios.onRequest((config) => {
    config.headers.common['X-Api-Token'] = store.state.apiToken;

    if (CACHE_ENABLED) {
      const key = getCacheKey(config);

      if (cache.has(key)) {
        const data = cache.get(key);

        config.data = data;

        // Set the request adapter to send the cached response
        // and prevent the request from actually running
        config.adapter = () => Promise.resolve({
          data,
          status: config.status,
          statusText: config.statusText,
          headers: config.headers,
          config,
          request: config,
        });
      }
    }

    return config;
  }, (error) => {
    // eslint-disable-next-line
    console.error(error);
    return Promise.reject(error);
  });

  $axios.onResponse((response) => {
    let bypassCache = false;

    try {
      bypassCache = response.headers['x-role'] !== 'guest';
      bypassCache = JSON.parse(response.config.params.__cache) === false;
    } catch (error) {
      //
    }

    if (CACHE_ENABLED && !bypassCache) {
      const key = getCacheKey(response.config);
      cache.set(key, response.data);
    }

    return response;
  }, (error) => {
    // eslint-disable-next-line
    console.error(error);
    return Promise.reject(error);
  });
};
