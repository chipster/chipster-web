import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import ConfigurationResource from './resources/configurationresource';
import {NavigationComponent} from "./views/navigation/navigation.component";


@NgModule({
    imports: [ BrowserModule, HttpModule ],
    declarations: [ NavigationComponent ],
    providers: [ ConfigurationResource ]
})
export class AppModule {}

