import { HttpClient } from "@angular/common/http";
import {
  Component,
  Input,
  OnDestroy,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import log from "loglevel";
import { Observable, of as observableOf, Subject } from "rxjs";
import { catchError, map, mergeMap, takeUntil, tap } from "rxjs/operators";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { ManualUtils } from "./manual-utils";

/**
 * Show HTML files in an Angular app
 *
 * Relative links are changed to use the Angular router for page changes. This makes it
 * fast to navigate between the pages as the user doesn't have to wait for the Angular
 * app to load all the time and it's nice to have the current page in the browser's
 * address bar too.
 *
 * Absolute links are changed to open in a new tab.
 */
@Component({
  selector: "ch-manual",
  templateUrl: "./manual.component.html",
  styleUrls: ["./manual.component.less"]
})
export class ManualComponent implements OnDestroy {
  private unsubscribe: Subject<any> = new Subject();

  @Input()
  private page: string;
  @Input()
  showControls = false;
  @Input()
  assetsPath = null;
  @Input()
  addContainer = true;
  @Input()
  routerPath: string = null;
  @Input()
  manualStyles = true;

  private readonly ABSOLUTE_PREFIX = "ABSOLUTE";
  private currentPage;

  // set to null to avoid change detection error when the undefined is changed to null
  html: SafeHtml = null;

  constructor(
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private configService: ConfigService,
    private sanitizer: DomSanitizer,
    private restErrorService: RestErrorService
  ) {}

  /**
   * Listen for route changes and show the corresponding page
   */
  ngAfterViewInit() {
    if (!this.routerPath) {
      this.routerPath = "/manual/";
    }

    this.activatedRoute.url
      .pipe(
        takeUntil(this.unsubscribe),
        // get configs
        mergeMap(() => {
          if (this.assetsPath) {
            return observableOf(this.assetsPath);
          }
          return this.configService.getManualPath();
        }),
        tap(path => (this.assetsPath = path)),
        mergeMap(() => {
          log.debug(
            "route changed",
            this.activatedRoute.snapshot.url,
            this.page,
            this.activatedRoute.snapshot.fragment
          );
          // only way to update the StaticHtmlComponent is to destroy it first
          this.html = null;

          if (this.page) {
            this.currentPage = this.page;
          } else {
            // get the current route path
            this.currentPage = this.activatedRoute.snapshot.url.join("/");
          }

          // get the html file
          return this.getPage(this.assetsPath + this.currentPage);
        }),
        // parse the html
        map(htmlString =>
          new DOMParser().parseFromString(htmlString, "text/html")
        ),
        // fix the links and image source addresses
        map(htmlDoc => this.rewrite(htmlDoc, this.currentPage)),
        // show
        map(html => {
          this.html = this.sanitizer.bypassSecurityTrustHtml(new XMLSerializer().serializeToString(html));
        }),
      )
      .subscribe({
        error: err =>
        this.restErrorService.showError("page change failed", err)
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /**
   * Fetch a html page and parse it
   *
   * @param path
   * @returns {Observable<HTMLDocument>}
   */
  getPage(path): Observable<string> {
    log.info("GET", path);

    return this.http.get(path, { responseType: "text" }).pipe(
      // replace missing pages with nicer message
      catchError(err => {
        if (err.status === 404) {
          return observableOf("<html><body>Page not found</body></html>");
        } else {
          throw err;
        }
      })
    );
  }

  /**
   * Set relative links to point to router paths that the ManualAComponent can later use for
   * navigation.
   *
   * Change absolute links to open in a new tab by setting a target attribute. When the link
   * is replaced with a ManualAComponent, the attributes like this are copied too.
   *
   * Reference image source addresses from their original location.
   *
   * @param {HTMLDocument} htmlDoc
   * @param {string} path
   * @returns {HTMLDocument}
   */
  rewrite(htmlDoc: HTMLDocument, path: string) {
    const links = htmlDoc.getElementsByTagName("a");
    Array.from(links).forEach(link => {
      // use getAttribute(), because link.href converts the url to absolute
      const href = link.getAttribute("href");
      if (link.name) {
        // link target, nothing to do
      } else if (ManualUtils.isAbsoluteUrl(href)) {
        // open absolute links in a new tab
        link.target = "_blank";
      } else if (href.startsWith(this.ABSOLUTE_PREFIX)) {
        // hack for for example accessibility routing
        link.href = href.substring(this.ABSOLUTE_PREFIX.length);
      } else if (href.startsWith("#")) {
        // relative urls navigate with the Angular router
        // router needs the page path when navigating within the page
        link.href = this.routerPath + path + href;
      } else {
        // relative urls navigate with the Angular router
        link.href = this.routerPath + href;
      }
    });

    const imgs = htmlDoc.getElementsByTagName("img");
    Array.from(imgs).forEach(img => {
      const src = img.getAttribute("src");
      if (src && !ManualUtils.isAbsoluteUrl(src)) {
        img.src = this.assetsPath + src;
      }
    });

    for (let i = 1; i <= 6; i++) {
      const headers = htmlDoc.getElementsByTagName("h" + i);
      Array.from(headers).forEach(element => {
        if (element.classList && this.manualStyles) {
          element.classList.add("ch-html-component");
        }
      });
    }

    // cannot use bootstrap styles until custom table styles are removed from the manual pages, e.g. in aligners-comparison.html
    // const tables = htmlDoc.getElementsByTagName("table");
    //   Array.from(tables).forEach(element => {
    //     if (element.classList && this.manualStyles) {
    //       // bootstrap table styles
    //       element.classList.add("table");
    //       element.classList.add("table-striped");
    //     }
    //   });

    return htmlDoc;
  }

  openNewWindow() {
    window.open(this.routerPath + this.currentPage, "_blank");
  }
}
