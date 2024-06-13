const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'mfe1',

  exposes: {

    "./routes": "./projects/mfe1/src/app/app.routes.ts",
    "./navbarComponent": "./projects/mfe1/src/app/navbar/navbar.component.ts"

  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});
