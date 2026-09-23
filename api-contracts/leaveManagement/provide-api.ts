import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { LeaveManagementApiConfiguration, LeaveManagementApiConfigurationParameters } from './configuration';
import { BASE_PATH } from './variables';

// Returns the service class providers, to be used in the [ApplicationConfig](https://angular.dev/api/core/ApplicationConfig).
export function provideApi(configOrBasePath: string | LeaveManagementApiConfigurationParameters): EnvironmentProviders {
    return makeEnvironmentProviders([
        typeof configOrBasePath === "string"
            ? { provide: BASE_PATH, useValue: configOrBasePath }
            : {
                provide: LeaveManagementApiConfiguration,
                useValue: new LeaveManagementApiConfiguration({ ...configOrBasePath }),
            },
    ]);
}