import { NgModule } from "@angular/core";
import { BytesPipe } from "./pipes/bytes.pipe";
import { ConfigurationResource } from "./resources/configurationresource";
import { FileResource } from "./resources/fileresource";
import { SessionResource } from "./resources/session.resource";
import { SessionWorkerResource } from "./resources/sessionworker.resource";
import { ToolResource } from "./resources/tool-resource";
import { AuthHttpClientService } from "./services/auth-http-client.service";
import { ConfigService } from "./services/config.service";
import { NativeElementService } from "./services/native-element.service";
import { NewsService } from "./services/news.service";
import { PipeService } from "./services/pipeservice.service";
import { PreferencesService } from "./services/preferences.service";
import { RouteService } from "./services/route.service";
import { SessionDbAdminService } from "./services/sessiondb-admin.service";
import { SettingsService } from "./services/settings.service";
import { SpreadsheetService } from "./services/spreadsheet.service";
import { ToolsService } from "./services/tools.service";
import { TsvService } from "./services/tsv.service";
import { TypeTagService } from "./services/typetag.service";
import { UserService } from "./services/user.service";
import { WebSocketService } from "./services/websocket.service";
import { TabService } from "./services/tab.service";
import { SchedulerResource } from "./resources/scheduler-resource";

/*
 * @description: Shared module should contain application global resources
 */

@NgModule({
  providers: [
    PipeService,
    TsvService,
    ConfigurationResource,
    ToolResource,
    SchedulerResource,
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
    NewsService,
    PreferencesService,
    SessionDbAdminService,
    TabService,
  ],
})
export class SharedModule {}
