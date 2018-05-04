import hash from 'object-hash';
import sizeof from 'object-sizeof';
import lruCache from 'lru-cache';

const cacheEnabled = true;
const cacheMaxAge = 30 * 60 * 1000;
const cacheMaxSize = 128 * 1000 * 1000;

const getCacheKey = config => hash({
  method: config.method,
  url: config.url.replace(config.baseURL, ''),
  params: config.params,
  data: config.data,
});

export default ({ $axios, store }) => {
  $axios.onRequest((config) => {
    config.headers.common['X-Api-Token'] = store.state.apiToken;
    return config;
  });

  if (!cacheEnabled) {
    return;
  }

  const cache = lruCache({
    maxAge: cacheMaxAge,
    max: cacheMaxSize,
    length: item => sizeof(item),
  });

  $axios.onRequest((config) => {
    if (cacheEnabled) {
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
      // eslint-disable-next-line
      bypassCache = JSON.parse(response.config.params.__cache) === false;
    } catch (error) {
      //
    }

    if (cacheEnabled && !bypassCache && response.config.method === 'get') {
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
