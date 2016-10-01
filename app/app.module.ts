import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import ConfigurationResource from './resources/configurationresource';


@NgModule({
    imports: [ BrowserModule, HttpModule ],
    declarations: [ ],
    providers: [ ConfigurationResource ]
})
export class AppModule {}

