/// <reference path="pipes/secondspipe.pipe.ts"/>
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CoreModule } from "../core/core.module";
import { AccountComponent } from "./components/account/account.component";
import { ActionToastComponent } from "./components/action-toast";
import { DummyRouteComponent } from "./components/dummy-route.component";
import { NotificationMessageComponent } from "./components/notifications/notification-message.component";
import { NotificationsListComponent } from "./components/notifications/notifications-list.component";
import { SearchBoxComponent } from "./components/search-box/search-box.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { StatusComponent } from "./components/status.component";
import { ToolSourceComponent } from "./components/tool-source/tool-source.component";
import { BytesPipe } from "./pipes/bytes.pipe";
import { CategoryPipe } from "./pipes/categorypipe.pipe";
import { DatasetsearchPipe } from "./pipes/datasetsearch.pipe";
import { LocalDatePipe } from "./pipes/local-date.pipe";
import { ModulePipe } from "./pipes/modulepipe.pipe";
import { SecondsPipe } from "./pipes/secondspipe.pipe";
import { ToolPipe } from "./pipes/toolpipe.pipe";
import { TrustedResourcePipe } from "./pipes/trustedresource.pipe";
import { ConfigurationResource } from "./resources/configurationresource";
import { FileResource } from "./resources/fileresource";
import { SessionResource } from "./resources/session.resource";
import { SessionWorkerResource } from "./resources/sessionworker.resource";
import { ToolResource } from "./resources/tool-resource";
import { AuthHttpClientService } from "./services/auth-http-client.service";
import { ConfigService } from "./services/config.service";
import { NativeElementService } from "./services/native-element.service";
import { NotificationsService } from "./services/notifications.service";
import { PipeService } from "./services/pipeservice.service";
import { RouteService } from "./services/route.service";
import { SettingsService } from "./services/settings.service";
import { SpreadsheetService } from "./services/spreadsheet.service";
import { ToolsService } from "./services/tools.service";
import { TsvService } from "./services/tsv.service";
import { TypeTagService } from "./services/typetag.service";
import { UserService } from "./services/user.service";
import { WebSocketService } from "./services/websocket.service";

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
    AccountComponent,
    ToolSourceComponent,
    DummyRouteComponent,
    ActionToastComponent,
    NotificationMessageComponent,
    NotificationsListComponent,
  ],
  providers: [
    PipeService,
    TsvService,
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
    WebSocketService,
    BytesPipe,
    NotificationsService,
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
    AccountComponent,
    ToolSourceComponent,
    ActionToastComponent,
    NotificationMessageComponent,
    NotificationsListComponent,
  ],
})
export class SharedModule {}
