import hash from 'object-hash';
import sizeof from 'object-sizeof';
import LruCache from 'lru-cache';
import { parse, serialize } from 'cookie';

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

export default ({ $axios, env, store, req, res, query }) => {
  env = Object.assign({
    CACHE_ENABLED: true,
    CACHE_MAX_AGE: 30 * 60 * 1000, // 30 mins
    CACHE_MAX_SIZE: 128 * 1000 * 1000, // 128mb
  }, env);

  let cache;

  if (env.CACHE_ENABLED) {
    cache = new LruCache({
      maxAge: env.CACHE_MAX_AGE,
      max: env.CACHE_MAX_SIZE,
      length: item => sizeof(item),
    });
  }

  $axios.onRequest((config) => {
    let cookies = {};
    if (req && req.headers.cookie) {
      cookies = parse(req.headers.cookie);
    }

    if (res && query.apiToken) {
      res.setHeader('Set-Cookie', serialize('apiToken', query.apiToken, { maxAge: 3600 }));
    }

    config.headers.common['x-api-token'] = query.apiToken || cookies.apiToken || env.API_TOKEN;

    const role = store.state.role || env.ROLE;

    if (env.CACHE_ENABLED && role === 'guest') {
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
    if (response.headers['x-role']) {
      store.commit('ROLE', response.headers['x-role']);
    }

    const role = store.state.role || env.ROLE;

    if (env.CACHE_ENABLED && role === 'guest') {
      let maxAge = env.CACHE_MAX_AGE;

      try {
        maxAge = JSON.parse(response.config.params.__cache);
      } catch (error) {
        //
      }

      if (maxAge !== false) {
        const key = getCacheKey(response.config);
        cache.set(key, response.data, maxAge);
      }
    }

    return response;
  }, (error) => {
    // eslint-disable-next-line
    console.error(error);
    return Promise.reject(error);
  });
};
