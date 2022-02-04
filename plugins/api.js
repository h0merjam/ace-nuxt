import { toPlainObject } from 'lodash';
import hash from 'hash-obj';
import * as Cookies from 'es-cookie';
import curlirize from 'axios-curlirize';

let Filru;
if (process.server) {
  Filru = require('filru');
}

let QuickLRU;
if (process.client) {
  QuickLRU = require('quick-lru').default;
}

const getCacheKey = (config) => {
  let headers = {
    ...(config.headers.common || {}),
    ...(config.headers || {}),
  };

  delete headers.common;
  delete headers.delete;
  delete headers.get;
  delete headers.head;
  delete headers.post;
  delete headers.put;
  delete headers.patch;

  const hashObj = {
    method: config.method,
    url: config.url.replace(config.baseURL, ''),
    token: headers['X-Api-Token'],
    params: config.params || {},
    body: config.body || {},
  };

  const hashStr = hash(toPlainObject(hashObj));

  return hashStr;
};

const cacheGet = async (cache, key) => JSON.parse(await cache.get(key));

const cacheSet = async (cache, key, value) =>
  await cache.set(key, JSON.stringify(await value));

export default async ({ $axios, $config, store, req, res, query }, inject) => {
  const options = {
    API_URL: '',
    API_TOKEN: '',
    DEBUG: false,
    CACHE_ENABLED: true,
    CACHE_MAX_AGE: 30 * 60 * 1000, // 30 mins
    CACHE_MAX_SIZE: 50 * 1024 * 1024, // 50mb
    ROLE: 'guest',
    ...$config,
  };

  let cookies = {};

  if (req && req.headers.cookie) {
    cookies = Cookies.parse(req.headers.cookie);
  }

  if (res && query.apiToken) {
    let expires = new Date();
    expires.setHours(expires.getHours() + 1);

    res.setHeader('Set-Cookie', [
      Cookies.encode('apiToken', query.apiToken, {
        expires,
      }),
    ]);
  }

  let cache;

  if (options.CACHE_ENABLED) {
    if (process.server) {
      cache = new Filru({
        dir: '/tmp/filru',
        maxBytes: options.CACHE_MAX_SIZE,
        maxAge: options.CACHE_MAX_AGE,
      });

      await cache.start();

      if (query.apiToken || cookies.apiToken) {
        await cache.clear();
      }
    }

    if (process.client) {
      cache = new QuickLRU({
        maxSize: Infinity,
      });
    }
  }

  const api = $axios.create({
    debug: options.DEBUG,
    proxyHeaders: false,
    baseURL: options.API_URL,
    headers: {
      common: {
        'X-Api-Token': options.API_TOKEN,
      },
    },
  });

  curlirize(api);

  api.interceptors.request.use(
    async (config) => {
      config.body = config.data;

      config.curlirize = false;

      config.headers['X-Api-Token'] =
        query.apiToken || cookies.apiToken || options.API_TOKEN;

      const role = store.state.role || options.ROLE;

      if (cache && role === 'guest') {
        const key = getCacheKey(config);

        try {
          const data = await cacheGet(cache, key);

          config.data = data;

          // Set the request adapter to send the cached response
          // and prevent the request from actually running
          config.adapter = () => {
            return Promise.resolve({
              data,
              status: config.status,
              statusText: config.statusText,
              headers: config.headers,
              config,
              request: config,
            });
          };
        } catch (error) {
          //
          // console.error(error);
        }
      }

      return config;
    },
    (error) => {
      // eslint-disable-next-line
      // console.error(error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    async (response) => {
      if (response.headers['x-role']) {
        store.commit('ROLE', response.headers['x-role']);
      }

      const role = store.state.role || options.ROLE;

      if (cache && role === 'guest') {
        let maxAge = options.CACHE_MAX_AGE;

        try {
          maxAge = JSON.parse(response.config.params.__cache);
        } catch (error) {
          //
        }

        if (maxAge !== false) {
          const key = getCacheKey(response.config);
          cacheSet(cache, key, response.data, maxAge);
        }
      }

      return response;
    },
    (error) => {
      if (
        error.config &&
        error.response &&
        error.response.status === 401 &&
        error.config.headers['X-Api-Token'] !== options.API_TOKEN
      ) {
        query.apiToken = '';
        cookies.apiToken = '';

        res.setHeader('Set-Cookie', [Cookies.encode('apiToken', '', {})]);

        error.config.headers['X-Api-Token'] = options.API_TOKEN;

        return api.request(error.config);
      }

      // eslint-disable-next-line
      console.error('ApiError', error.response.status);
      console.error(error.response.data);
      console.error(
        error.response.config.curlCommand,
        `-H "X-Api-Token: ${error.response.config.headers['X-Api-Token']}"`,
        `-H "Content-Type: application/json"`
      );
      return Promise.resolve(error);
    }
  );

  inject('api', api);
};
