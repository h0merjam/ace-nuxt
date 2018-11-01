import hash from 'object-hash';
import sizeof from 'object-sizeof';
import lruCache from 'lru-cache';

const getCacheKey = (config) => {
  let headers = config.headers;

  if (config.headers.common) {
    headers = Object.assign({}, config.headers.common, config.headers[config.method]);
  }

  const hashObj = {
    method: config.method,
    url: config.url.replace(config.baseURL, ''),
    headers,
    params: config.params,
    data: config.data,
  };

  return hash(hashObj);
};

export default ({ $axios, store, env }) => {
  env = Object.assign({
    CACHE_ENABLED: true,
    CACHE_MAX_AGE: 30 * 60 * 1000, // 30 mins
    CACHE_MAX_SIZE: 128 * 1000 * 1000, // 128mb
  }, env);

  let cache;

  if (env.CACHE_ENABLED) {
    cache = lruCache({
      maxAge: env.CACHE_MAX_AGE,
      max: env.CACHE_MAX_SIZE,
      length: item => sizeof(item),
    });
  }

  $axios.onRequest((config) => {
    config.headers.common['X-Api-Token'] = store.state.apiToken || env.API_TOKEN;

    const role = store.state.role || env.ROLE;

    if (role !== 'guest') {
      return config;
    }

    if (env.CACHE_ENABLED) {
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
    if (env.CACHE_ENABLED) {
      let bypassCache = false;

      try {
        bypassCache = response.headers['x-role'] !== 'guest';
        bypassCache = JSON.parse(response.config.params.__cache) === false;
      } catch (error) {
        //
      }

      if (!bypassCache) {
        const key = getCacheKey(response.config);

        cache.set(key, response.data);
      }
    }

    return response;
  }, (error) => {
    // eslint-disable-next-line
    console.error(error);
    return Promise.reject(error);
  });
};
