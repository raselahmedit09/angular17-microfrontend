const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'mfe2',

  exposes: {
    "./routes": "./projects/mfe2/src/app/app.routes.ts",
    "./navbarComponent": "./projects/mfe2/src/app/navbar/navbar.component.ts"
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});
