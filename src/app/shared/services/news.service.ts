import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Role } from "chipster-js-common";
import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
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
    const action$ = this.dialogModalService.openEditNewsModal(news).pipe(
      mergeMap((editedNews: NewsItem) => {
        // edited or new
        if (news == null) {
          return this.addNewsItem(editedNews.contents);
        }
        return this.updateNewsItem(editedNews);
      })
    );
    return action$;
  }

  public getAllNews(): Observable<NewsItem[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => {
        const response = this.httpClient.get<NewsItem[]>(`${url}/news`, this.tokenService.getTokenParams(true));
        return response;
      })
    );
  }

  public addNewsItem(newsContents: NewsContents) {
    return this.configService.getAdminUri(Role.SESSION_DB).pipe(
      mergeMap((url: string) =>
        this.httpClient.post(
          `${url}/admin/news`,
          {
            contents: newsContents,
          },
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: NewsItem) => response.newsId)
    );
  }

  public updateNewsItem(news: NewsItem) {
    return this.configService
      .getAdminUri(Role.SESSION_DB)
      .pipe(
        mergeMap((url: string) =>
          this.httpClient.put(`${url}/admin/news/${news.newsId}/`, news, this.tokenService.getTokenParams(true))
        )
      );
  }

  public deleteNewsItem(news: NewsItem) {
    return this.configService
      .getAdminUri(Role.SESSION_DB)
      .pipe(
        mergeMap((url: string) =>
          this.httpClient.delete(`${url}/admin/news/${news.newsId}/`, this.tokenService.getTokenParams(true))
        )
      );
  }
}
