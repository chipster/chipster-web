import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { TokenService } from "../../core/authentication/token.service";
import { DialogModalService } from "../../views/sessions/session/dialogmodal/dialogmodal.service";
import { NewsContents } from "../components/news/NewsContents";
import { NewsItem } from "../components/news/NewsItem";
import { ConfigService } from "./config.service";

@Injectable()
export class NewsService {
  constructor(
    private dialogModalService: DialogModalService,
    private configService: ConfigService,
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}

  public openModalAndUploadNews(news?: NewsItem): Observable<any> {
    console.log(news);
    const action$ = this.dialogModalService.openEditNewsModal(news).pipe(
      mergeMap((editedNews: NewsItem) => {
        // edited or new
        if (news == null) {
          return this.addNewsItem(editedNews.contents);
        }
        return this.updateNewsItem(editedNews);
      })
    );

    // this.dialogModalService.openSpinnerModal("Saving news", action$).subscribe({
    //   next: (result) => log.info("add news done", result),
    //   error: (error) => log.warn("add news failed", error),
    // });

    // action$.subscribe({
    //   next: (result) => log.info("add news done", result),
    //   error: (error) => log.warn("add news failed", error),
    // });
    return action$;
  }

  public getAllNews(): Observable<NewsItem[]> {
    console.log("get all news");
    // return this.configService.getSessionDbUrl().pipe(
    //   mergeMap((url: string) => {
    //     const response = this.httpClient.get<NewsItem[]>(`${url}/news`, this.tokenService.getTokenParams(true));
    //     console.log(response);
    //     return response;
    //   })
    // );

    return of(this.getExampleNews());
  }

  public addNewsItem(newsContents: NewsContents) {
    console.log("upload news");
    // return this.configService.getAdminUri(Role.SESSION_DB).pipe(
    //   mergeMap((url: string) =>
    //     this.httpClient.post(`${url}/admin/news`, { contents: newsContents }, this.tokenService.getTokenParams(true))
    //   ),
    //   map((response: NewsItem) => response.newsId)
    // );

    return of(true);
  }

  public updateNewsItem(news: NewsItem) {
    console.log("upload edited news");
    // return this.configService.getAdminUri(Role.SESSION_DB).pipe(
    //   mergeMap((url: string) =>
    //     this.httpClient.put(`${url}/admin/news/${news.newsId}/`, news, this.tokenService.getTokenParams(true))
    //   ),
    //   map((response: NewsItem) => response.newsId)
    // );

    return of(true);
  }

  public deleteNewsItem(news: NewsItem) {
    console.log("send delete news");
    // return this.configService.getAdminUri(Role.SESSION_DB).pipe(
    //   mergeMap((url: string) =>
    //     this.httpClient.delete(`${url}/admin/news/${news.newsId}/`, this.tokenService.getTokenParams(true))
    //   ),
    //   map((response: NewsItem) => response.newsId)
    // );

    return of(true);
  }

  public getExampleNews(): NewsItem[] {
    return [
      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },
      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },

      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },

      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },

      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },

      {
        newsId: uuidv4(),
        created: new Date(),
        contents: {
          title: "New version released",
          shortTitle: "New release",
          body: '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
        },
      },
    ];
  }
}
