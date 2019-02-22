///<reference path="pipes/secondspipe.pipe.ts"/>
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BytesPipe } from "./pipes/bytes.pipe";
import { TrustedResourcePipe } from "./pipes/trustedresource.pipe";
import { LocalDatePipe } from "./pipes/local-date.pipe";
import { DatasetsearchPipe } from "./pipes/datasetsearch.pipe";
import { ToolPipe } from "./pipes/toolpipe.pipe";
import { PipeService } from "./services/pipeservice.service";
import { ModulePipe } from "./pipes/modulepipe.pipe";
import { SecondsPipe } from "./pipes/secondspipe.pipe";
import { CategoryPipe } from "./pipes/categorypipe.pipe";
import { TSVReader } from "./services/TSVReader";
import { ConfigurationResource } from "./resources/configurationresource";
import { CoreModule } from "../core/core.module";
import { ToolResource } from "./resources/tool-resource";
import { SessionWorkerResource } from "./resources/sessionworker.resource";
import { FileResource } from "./resources/fileresource";
import { SessionResource } from "./resources/session.resource";
import { ConfigService } from "./services/config.service";
import { TypeTagService } from "./services/typetag.service";
import { SearchBoxComponent } from "./components/search-box/search-box.component";
import { FormsModule } from "@angular/forms";
import { RouteService } from "./services/route.service";
import { StatusComponent } from "./components/status.component";
import { AuthHttpClientService } from "./services/auth-http-client.service";
import { SpreadsheetService } from "./services/spreadsheet.service";
import { SettingsComponent } from "./components/settings/settings.component";
import { SettingsService } from "./services/settings.service";
import { ToolSourceComponent } from "./components/tool-source/tool-source.component";
import { DummyRouteComponent } from "./components/dummy-route.component";
import { UserService } from "./services/user.service";
import { ToolsService } from "./services/tools.service";
import { NativeElementService } from "./services/native-element.service";
import { WebSocketService } from "./services/websocket.service";
import { ActionToastComponent } from "./components/action-toast";

/*
 * @description: Shared module should contain application global resources
 */

@NgModule({
  imports: [CommonModule, CoreModule, FormsModule],
  declarations: [
    BytesPipe,
    TrustedResourcePipe,
    LocalDatePipe,
    DatasetsearchPipe,
    ToolPipe,
    CategoryPipe,
    ModulePipe,
    SecondsPipe,
    SearchBoxComponent,
    StatusComponent,
    SettingsComponent,
    ToolSourceComponent,
    DummyRouteComponent,
    ActionToastComponent
  ],
  providers: [
    PipeService,
    TSVReader,
    ConfigurationResource,
    ToolResource,
    SessionWorkerResource,
    FileResource,
    SessionResource,
    ConfigService,
    TypeTagService,
    RouteService,
    AuthHttpClientService,
    SpreadsheetService,
    SettingsService,
    UserService,
    ToolsService,
    NativeElementService,
    WebSocketService
  ],
  exports: [
    BytesPipe,
    TrustedResourcePipe,
    LocalDatePipe,
    DatasetsearchPipe,
    ToolPipe,
    CategoryPipe,
    ModulePipe,
    SecondsPipe,
    SearchBoxComponent,
    StatusComponent,
    SettingsComponent,
    ToolSourceComponent,
    ActionToastComponent
  ],
  entryComponents: [ActionToastComponent, SettingsComponent]
})
export class SharedModule {}
