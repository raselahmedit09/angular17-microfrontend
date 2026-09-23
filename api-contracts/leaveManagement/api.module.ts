import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { LeaveManagementApiConfiguration } from './configuration';
import { HttpClient } from '@angular/common/http';


@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: []
})
export class LeaveManagementApiModule {
    public static forRoot(configurationFactory: () => LeaveManagementApiConfiguration): ModuleWithProviders<LeaveManagementApiModule> {
        return {
            ngModule: LeaveManagementApiModule,
            providers: [ { provide: LeaveManagementApiConfiguration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: LeaveManagementApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('LeaveManagementApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
