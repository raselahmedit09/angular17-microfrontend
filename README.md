# Angular Microfrontend Project with Module Federation
This repository demonstrates an Angular 17 project structured with Module Federation. The architecture includes a shell application that serves as the host, two microfrontend (MFE) applications, and a shared library. The project leverages @angular-architects/module-federation for dynamic module loading and inter-app communication.

## The key components include:

- Shell Project: The main host application that orchestrates the loading of micro frontends.
- Microfrontend 1 (MFE1): A standalone Angular application that integrates with the shell via Module Federation.
- Microfrontend 2 (MFE2): Another standalone Angular application, similar to MFE1, integrated with the shell.
- Shared Library (Lib1): A library project containing common components and utilities used across the shell and micro frontends.

## Features
- Module Federation: Dynamic loading and sharing of Angular modules across different applications.
- Shared Library: Common components and services shared between the shell and micro frontends.
- Routing Integration: Seamless routing setup to handle navigation between the shell and micro frontends.
- Breadcrumb Component: A shared breadcrumb component used to navigate through different sections of the application.
- DatePipe   

## Update .npmrc file (_authToken with given key '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')
```sh
registry=https://registry.npmjs.org/
@raselahmedit09:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=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
```

## Setup
```sh
> npm install
or 
> npm cache clean 
> npm audit fix --focce

if you getting error then remove "@raselahmedit09/lib1": "^0.0.1" from package.json  file and try again.
Remove the package reference & use local library reference in the project files as well.

use import { BreadcrumbComponent } from '../../../lib1/src/lib/components/breadcrumb/breadcrumb.component'
instead of import { BreadcrumbComponent } from 'lib1' in Shell > app.component.ts file 
```
## Run
```sh
> ng build lib1
> ng serve shell -0 
> ng serve mfe1
> ng serve mfe2
```
## Further help
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

https://www.angulararchitects.io/en/blog/module-federation-with-angulars-standalone-components/
