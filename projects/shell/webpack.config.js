const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  // remotes: {
  //   "mfe1": "http://localhost:4201/remoteEntry.js",
  //   "mfe2": "http://localhost:4202/remoteEntry.js",
  // },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

module.exports.output.scriptType = "text/javascript";
