import { htmlToText } from 'html-to-text';
import { truncate } from 'lodash';

export default function () {
  const siteTitle = this.$config.SITE_TITLE || '';
  const titleChunk = this.$store.state.metadata.title;
  const description = truncate(
    htmlToText(this.$store.state.metadata.description),
    { length: 500 }
  );
  const image = this.$store.state.metadata.image;

  const title = titleChunk
    ? titleChunk.indexOf(siteTitle) === -1
      ? `${titleChunk} | ${siteTitle}`
      : titleChunk
    : siteTitle;

  let meta = [
    { hid: 'ogTitle', name: 'og:title', content: title },
    { hid: 'twitterTitle', name: 'twitter:title', content: title },

    { hid: 'description', name: 'description', content: description },
    { hid: 'ogDescription', name: 'og:description', content: description },
    {
      hid: 'twitterDescription',
      name: 'twitter:description',
      content: description,
    },
  ];

  if (image) {
    meta = meta.concat([
      { hid: 'ogImage', name: 'og:image', content: image },
      { hid: 'twitterImage', name: 'twitter:image', content: image },
    ]);
  }

  return {
    title,
    meta,
    htmlAttrs: {
      route: this.$route.name,
    },
    bodyAttrs: {
      route: this.$route.name,
    },
  };
}
