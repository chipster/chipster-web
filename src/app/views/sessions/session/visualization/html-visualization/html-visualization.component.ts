import { Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Dataset } from "chipster-js-common";
import { fromEvent, Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../session-data.service";

/**
 * Show a html dataset in a sandboxed iframe.
 *
 * The dataset is user content and must not run on the origin of the app, because scripts on
 * that origin can read the auth token from the localStorage. The content is fetched with the
 * normal authenticated request and given to the iframe as a blob: URL. The iframe has the
 * "sandbox" attribute without "allow-same-origin", so the content gets an opaque origin also
 * when it's loaded from a blob: URL. Its scripts still run (needed for interactive reports),
 * but they can't access the localStorage, cookies or the parent page. Links with
 * target="_blank" are allowed to open a new tab ("allow-popups"). The new tab is not sandboxed
 * ("allow-popups-to-escape-sandbox"), because otherwise cookies and storage wouldn't work on
 * the linked site. The opener of the new tab is the sandboxed frame with an opaque origin, so
 * this doesn't give it access to the app either.
 *
 * The file is fetched as raw bytes and the charset of the blob declares the encoding, like the
 * meta tag of the old wrapper page did. Tool outputs are UTF-8.
 *
 * The parent page can't read the size of a sandboxed document, so a small script is added to
 * the content which reports the size to the parent with postMessage. The size comes from
 * untrusted content, so it's clamped before use. If the content replaces the document with
 * document.write and the size is never reported, the css gives the iframe a usable default
 * height.
 *
 * The same script makes links to external sites open in a new tab. Many reports have plain links
 * to sites like NCBI, which would otherwise navigate the iframe itself and fail, because those
 * sites don't allow framing (X-Frame-Options).
 */
@Component({
  selector: "ch-htmlvisualization",
  templateUrl: "./html-visualization.component.html",
  styleUrls: ["./html-visualization.component.less"],
})
export class HtmlvisualizationComponent implements OnInit, OnChanges, OnDestroy {
  private static readonly SIZE_MESSAGE_TYPE = "chipster-html-visualization-size";
  private static readonly MAX_FRAME_SIZE_PX = 100_000;

  /**
   * Script which is added before the html content to report the size of the document to the
   * parent page and to open links in a new tab. It's added before the content (not after it),
   * because a truncated file could end inside an unclosed element like <script> or a comment,
   * which would make an appended script inert. The doctype makes sure that the document is
   * parsed in the standards mode. A possible doctype of the content itself comes later and is
   * simply ignored by the parser.
   */
  private static readonly FRAME_SCRIPT = `<!DOCTYPE html>
<script>
(function () {
  var reported = null;
  function report() {
    var body = document.body;
    if (!body) {
      return;
    }
    body.style.margin = "0";
    // measure the body instead of the documentElement: the documentElement is never smaller
    // than the iframe itself, so the iframe could grow but never shrink back
    var size = {
      type: "${HtmlvisualizationComponent.SIZE_MESSAGE_TYPE}",
      height: Math.max(body.scrollHeight, body.offsetHeight),
      width: Math.max(body.scrollWidth, body.offsetWidth)
    };
    if (reported && reported.height === size.height && reported.width === size.width) {
      return;
    }
    reported = size;
    window.parent.postMessage(size, "*");
  }
  document.addEventListener("DOMContentLoaded", function () {
    report();
    if (window.ResizeObserver) {
      new ResizeObserver(report).observe(document.body);
    }
  });
  window.addEventListener("load", report);

  // Open links to external sites in a new tab. The capture phase runs before the page's own
  // handlers and the default action, which reads the target only after this.
  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest("a") : null;
    if (!link || link.hasAttribute("target")) {
      return;
    }
    var href = link.getAttribute("href") || link.getAttribute("xlink:href");
    href = href ? href.trim().toLowerCase() : "";
    // only absolute links to other sites: links within the document (#fragment) must stay in
    // this frame and relative links couldn't be resolved against the blob: URL of this
    // document anyway
    if (href.indexOf("http://") !== 0 && href.indexOf("https://") !== 0) {
      return;
    }
    link.setAttribute("target", "_blank");
    // the new tab escapes the sandbox, so don't leave it a window.opener for navigating this frame
    if (link.relList) {
      link.relList.add("noopener");
    } else {
      link.setAttribute("rel", "noopener");
    }
  }, true);
})();
</script>
`;

  @Input()
  private dataset: Dataset;

  @ViewChild("htmlframe")
  private htmlframe: ElementRef<HTMLIFrameElement>;

  private unsubscribe: Subject<any> = new Subject();
  private messageSubscription: Subscription;
  private objectUrl: string;
  state: LoadState;

  public src: SafeResourceUrl;

  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    // listen outside Angular, because the size messages can arrive on every animation frame and
    // the handler only sets the size of the iframe, no change detection is needed
    this.ngZone.runOutsideAngular(() => {
      this.messageSubscription = fromEvent<MessageEvent>(window, "message").subscribe((event) => this.onMessage(event));
    });
  }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);
    this.state = new LoadState(State.Loading, "Loading html file...");
    this.src = null;
    this.revokeObjectUrl();

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, null, true)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (bytes: ArrayBuffer) => {
          // raw bytes and a blob: URL instead of a decoded string and srcdoc: the file isn't
          // re-encoded or serialized a second time into an attribute of this page
          const blob = new Blob([HtmlvisualizationComponent.FRAME_SCRIPT, bytes], {
            type: "text/html;charset=utf-8",
          });
          this.objectUrl = URL.createObjectURL(blob);
          // the blob: URL goes only to the sandboxed iframe, see the comment on the class
          this.src = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
          this.state = new LoadState(State.Ready);
        },
        error: (error: any) => {
          this.state = new LoadState(State.Fail, "Loading html file failed");
          this.restErrorService.showError(this.state.message, error);
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    this.revokeObjectUrl();
  }

  private revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  /**
   * Resize the iframe to the content size when the sandboxed document reports it
   */
  private onMessage(event: MessageEvent) {
    const frame = this.htmlframe?.nativeElement;

    // accept messages only from our own iframe
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }

    const data = event.data;
    if (
      data == null ||
      data.type !== HtmlvisualizationComponent.SIZE_MESSAGE_TYPE ||
      !Number.isFinite(data.height) ||
      !Number.isFinite(data.width)
    ) {
      return;
    }

    // a report whose visible content is positioned out of the normal flow can measure a
    // zero-size body: keep the css fallback size instead of collapsing the iframe
    if (data.height <= 0 || data.width <= 0) {
      return;
    }

    // the size comes from untrusted content, don't let it force an absurd layout
    const max = HtmlvisualizationComponent.MAX_FRAME_SIZE_PX;
    frame.style.height = Math.min(Math.max(0, data.height), max) + "px";
    frame.style.width = Math.min(Math.max(0, data.width), max) + "px";
  }
}
