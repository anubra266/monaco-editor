module.exports = {
  future: {
    webpack5: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // config.module.rules.push({
    //   test: /\.mdx/,
    //   use: [
    //     options.defaultLoaders.babel,
    //     {
    //       loader: "@mdx-js/loader",
    //       options: pluginOptions.options,
    //     },
    //   ],
    // });
    return config;
  },
};
