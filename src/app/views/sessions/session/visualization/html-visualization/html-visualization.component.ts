import { Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
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
 * normal authenticated request and given to the iframe in its srcdoc attribute. The iframe has
 * the "sandbox" attribute without "allow-same-origin", so the content gets an opaque origin. Its
 * scripts still run (needed for interactive reports), but they can't access the localStorage,
 * cookies or the parent page.
 *
 * The content is given as srcdoc rather than as a blob: URL on purpose. A blob: URL created by
 * the app has the origin of the app, and the content could read the URL from its location and
 * get it opened outside the sandbox, e.g. by showing it as a link for the user to copy to the
 * address bar. A srcdoc document has no such URL (its location is about:srcdoc), so there is
 * nothing to leak. That's also why the new tabs which the content opens may escape the sandbox
 * ("allow-popups", "allow-popups-to-escape-sandbox"): the content can only open URLs which any
 * web page could link to, and the initial document of the new tab inherits the opaque origin.
 * Without the escape, cookies and storage wouldn't work on the linked site.
 *
 * A srcdoc document resolves relative URLs against the URL of the parent page, so a link to an
 * anchor (#section) would navigate the iframe to the app. A <base href="about:srcdoc"> in front
 * of the content makes references to inline SVG elements resolve within the document again, but
 * the browsers don't navigate to a fragment of a srcdoc document either, so the script handles
 * anchor links itself and asks the parent page to scroll, because a scroll within the iframe
 * doesn't reach the parent page in all browsers. Relative URLs to files can't be resolved and do
 * nothing, as they couldn't with the old wrapper page either.
 *
 * The sandbox denies the localStorage, sessionStorage and cookies. Reports like MultiQC read
 * their settings from them when they start and fail if the reads throw, so the script in front
 * of the content replaces them with in-memory stand-ins. Settings then work while the report is
 * shown, but aren't saved.
 *
 * The file is fetched as text, decoded as UTF-8 by the browser. Tool outputs are UTF-8. The
 * srcdoc attribute holds a copy of the whole file, which a blob: URL would have avoided; that's
 * the price of not having a URL to leak.
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
  private static readonly SCROLL_MESSAGE_TYPE = "chipster-html-visualization-scroll";
  private static readonly MAX_FRAME_SIZE_PX = 100_000;

  /**
   * Prefix for the html content: a base URL and a script which provides in-memory storage,
   * reports the size of the document to the parent page and opens links in a new tab. It's
   * added before the content (not after it), because a truncated file could end inside an
   * unclosed element like <script> or a comment, which would make an appended script inert, and
   * because the storage has to exist before the scripts of the content run. The doctype makes
   * sure that the document is parsed in the standards mode. A possible doctype of the content
   * itself comes later and is simply ignored by the parser.
   */
  private static readonly FRAME_SCRIPT = `<!DOCTYPE html>
<base href="about:srcdoc">
<script>
(function () {
  // In-memory stand-ins for the storage which the sandbox denies. Reports like MultiQC read
  // their settings from the localStorage and cookies when they start, and stop working if the
  // reads throw. Nothing here outlives the document.
  function memoryStorage() {
    var data = {};
    function has(key) {
      return typeof key === "string" && Object.prototype.hasOwnProperty.call(data, key);
    }
    var methods = {
      getItem: function (key) { return has(key) ? data[key] : null; },
      setItem: function (key, value) { data[key] = String(value); },
      removeItem: function (key) { delete data[key]; },
      clear: function () { data = {}; },
      key: function (index) { return Object.keys(data)[index] || null; }
    };
    Object.defineProperty(methods, "length", { get: function () { return Object.keys(data).length; } });
    if (typeof Proxy !== "function") {
      return methods;
    }
    // the real Storage can be used also like a plain object: storage.key and storage["key"]
    return new Proxy(methods, {
      get: function (target, key) { return key in methods ? methods[key] : has(key) ? data[key] : undefined; },
      set: function (target, key, value) { methods.setItem(key, value); return true; },
      deleteProperty: function (target, key) { delete data[key]; return true; },
      has: function (target, key) { return key in methods || has(key); },
      ownKeys: function () { return Object.keys(data); },
      getOwnPropertyDescriptor: function (target, key) {
        return has(key) ? { value: data[key], writable: true, enumerable: true, configurable: true } : undefined;
      }
    });
  }
  function isDenied(read) {
    try {
      read();
      return false;
    } catch (e) {
      return true;
    }
  }
  // the replacement may fail in a browser where the property isn't configurable, which must
  // not stop the rest of this script
  function replace(object, name, descriptor) {
    try {
      descriptor.configurable = true;
      Object.defineProperty(object, name, descriptor);
    } catch (e) {
      // the content gets the throwing original
    }
  }
  ["localStorage", "sessionStorage"].forEach(function (name) {
    if (isDenied(function () { return window[name]; })) {
      replace(window, name, { value: memoryStorage() });
    }
  });
  if (isDenied(function () { return document.cookie; })) {
    var cookies = {};
    replace(document, "cookie", {
      get: function () {
        return Object.keys(cookies).map(function (name) { return name + "=" + cookies[name]; }).join("; ");
      },
      set: function (value) {
        var parts = String(value).split(";");
        var pair = parts[0].split("=");
        var name = pair[0].trim();
        if (!name) {
          return;
        }
        // a cookie is deleted by setting it expired
        var expired = parts.slice(1).some(function (attribute) {
          var attr = attribute.split("=");
          var attrName = attr[0].trim().toLowerCase();
          var attrValue = attr.slice(1).join("=").trim();
          return (attrName === "max-age" && Number(attrValue) <= 0)
            || (attrName === "expires" && new Date(attrValue).getTime() <= Date.now());
        });
        if (expired) {
          delete cookies[name];
        } else {
          cookies[name] = pair.slice(1).join("=").trim();
        }
      }
    });
  }

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

  // The element of a fragment, by id or name, as written or percent-decoded
  function findFragmentTarget(fragment) {
    var ids = [fragment];
    try {
      var decoded = decodeURIComponent(fragment);
      if (decoded !== fragment) {
        ids.push(decoded);
      }
    } catch (e) {
      // not percent-encoded
    }
    for (var i = 0; i < ids.length; i++) {
      var element = ids[i] ? document.getElementById(ids[i]) || document.getElementsByName(ids[i])[0] : null;
      if (element) {
        return element;
      }
    }
    return null;
  }

  // Handle links within the document and open links to external sites in a new tab. The capture
  // phase runs before the page's own handlers and the default action, which reads the target
  // only after this.
  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest("a") : null;
    if (!link) {
      return;
    }
    var href = link.getAttribute("href") || link.getAttribute("xlink:href");
    href = href ? href.trim() : "";
    // Links within the document (#fragment) must stay in this frame, but a srcdoc document can't
    // navigate to a fragment: the browser resolves the link to about:srcdoc#fragment (or to the
    // URL of the app without the <base> above) and reloads or drops the frame instead of
    // scrolling. Scroll here and cancel the navigation, also for the common href="#" of buttons.
    if (href.charAt(0) === "#") {
      event.preventDefault();
      var target = findFragmentTarget(href.substring(1));
      // a hidden target, like the pane of a tab or a collapsed section which the page's own
      // handler is about to show, isn't a place to scroll to
      if (target && (target.getClientRects().length > 0 || target.offsetParent)) {
        // scrolls this document, if it's scrollable at all. Whether this also scrolls the parent
        // page depends on the browser (Chrome does, Safari doesn't), so ask the parent to scroll
        // to the position of the target within this frame.
        target.scrollIntoView();
        window.parent.postMessage({
          type: "${HtmlvisualizationComponent.SCROLL_MESSAGE_TYPE}",
          top: target.getBoundingClientRect().top
        }, "*");
      }
      return;
    }
    if (link.hasAttribute("target")) {
      return;
    }
    // only absolute links to other sites: relative links can't be resolved against
    // about:srcdoc anyway
    var lowerCaseHref = href.toLowerCase();
    if (lowerCaseHref.indexOf("http://") !== 0 && lowerCaseHref.indexOf("https://") !== 0) {
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

  /**
   * The iframe exists while the state is ready. The content is set here instead of a srcdoc
   * binding in the template, so that the component doesn't have to keep its own copy of the
   * whole file next to the copy in the srcdoc attribute for as long as the file is shown.
   * Reports can be tens of megabytes.
   */
  @ViewChild("htmlframe")
  set htmlframe(frame: ElementRef<HTMLIFrameElement>) {
    this.frame = frame?.nativeElement;
    if (this.frame && this.html != null) {
      // the html goes only to the sandboxed iframe, see the comment on the class. The sandbox
      // attribute is static in the template, so it's set before the content.
      this.frame.srcdoc = this.html;
      this.html = null;
    }
  }

  private frame: HTMLIFrameElement;
  private html: string;
  private lastScrollTime = 0;
  private unsubscribe: Subject<any> = new Subject();
  private messageSubscription: Subscription;
  state: LoadState;

  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
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
    this.html = null;

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (html: string) => {
          // given to the iframe when the ready state has created it
          this.html = HtmlvisualizationComponent.FRAME_SCRIPT + html;
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
  }

  private onMessage(event: MessageEvent) {
    const frame = this.frame;

    // accept messages only from our own iframe
    if (!frame || event.source !== frame.contentWindow || event.data == null) {
      return;
    }

    if (event.data.type === HtmlvisualizationComponent.SIZE_MESSAGE_TYPE) {
      this.onSizeMessage(frame, event.data.height, event.data.width);
    } else if (event.data.type === HtmlvisualizationComponent.SCROLL_MESSAGE_TYPE) {
      this.onScrollMessage(frame, event.data.top);
    }
  }

  /**
   * Scroll the page to a position within the iframe when the sandboxed document asks for it
   *
   * The page can't scroll to an element of the cross-origin document, but it can scroll to an
   * element of its own placed over the iframe at the same height. The position comes from
   * untrusted content, so it's kept within the iframe.
   */
  private onScrollMessage(frame: HTMLIFrameElement, top: unknown) {
    if (typeof top !== "number" || !Number.isFinite(top)) {
      return;
    }

    // only after a click of the user in the iframe, where the browser tells, and not more often
    // than the user can click, so that the content can't hold the page in place
    const now = Date.now();
    if (now - this.lastScrollTime < 500 || (navigator.userActivation && !navigator.userActivation.isActive)) {
      return;
    }
    this.lastScrollTime = now;

    const scroller = frame.parentElement;
    const marker = document.createElement("div");
    marker.style.position = "absolute";
    marker.style.top = frame.offsetTop + Math.min(Math.max(0, top), frame.clientHeight) + "px";
    // in the visible part of a wide report, so that only the vertical position changes
    marker.style.left = scroller.scrollLeft + "px";
    marker.style.height = "1px";
    scroller.appendChild(marker);
    marker.scrollIntoView({ block: "start" });
    marker.remove();
  }

  /**
   * Resize the iframe to the content size when the sandboxed document reports it
   */
  private onSizeMessage(frame: HTMLIFrameElement, height: unknown, width: unknown) {
    if (
      typeof height !== "number" ||
      typeof width !== "number" ||
      !Number.isFinite(height) ||
      !Number.isFinite(width)
    ) {
      return;
    }

    // a report whose visible content is positioned out of the normal flow can measure a
    // zero-size body: keep the css fallback size instead of collapsing the iframe
    if (height <= 0 || width <= 0) {
      return;
    }

    // the size comes from untrusted content, don't let it force an absurd layout
    const max = HtmlvisualizationComponent.MAX_FRAME_SIZE_PX;
    frame.style.height = Math.min(Math.max(0, height), max) + "px";
    frame.style.width = Math.min(Math.max(0, width), max) + "px";
  }
}
