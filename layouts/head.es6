import htmlToText from 'html-to-text';

export default function () {
  const title = this.$store.state.metadata.title || process.env.siteTitle;
  const description = htmlToText.fromString(this.$store.state.metadata.description);
  const image = this.$store.state.metadata.image;

  let meta = [
    { hid: 'ogTitle', name: 'og:title', content: title },
    { hid: 'twitterTitle', name: 'twitter:title', content: title },

    { hid: 'description', name: 'description', content: description },
    { hid: 'ogDescription', name: 'og:description', content: description },
    { hid: 'twitterDescription', name: 'twitter:description', content: description },
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
