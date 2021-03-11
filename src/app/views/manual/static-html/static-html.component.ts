import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import log from "loglevel";
import { ManualUtils } from "../manual-utils";

/**
 * Show HTML files in an Angular app
 * 
 * The html is added to the element's [innerHtml] input. Angular doesn't compile that html, so we have 
 * to fix scrolling and router links ourselves directly in the DOM. The easiest way to know when Angular has
 * added the html to the DOM is to have the html available already when this component is created, Then we
 * know that the elements are in the DOM when the ngAfterViewInit() methods is called. This would be a problem
 * also if the html would be updated. To avoid that, this components must not be reused.
 */
@Component({
  selector: "ch-static-html",
  templateUrl: "./static-html.component.html",
  styleUrls: ["./static-html.component.less"]
})
export class StaticHtmlComponent implements AfterViewInit, OnDestroy, OnChanges {

  @Input()
  html: SafeHtml;
  private anchors: any;

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
  }

  ngAfterViewInit() {
    this.registerAnchorEventListeners();
    this.scrollToFragment(this.activatedRoute.snapshot.fragment);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.html.previousValue != null) {
      log.warn("do not update StaticHtmlComponent, it must be destroyed first", changes);
    }
  }

  ngOnDestroy() {
    this.unregisterAnchorEventListeners();
  }

  getHref(anchor: HTMLAnchorElement) {
    return anchor.getAttribute("href");
  }

  public handleAnchorClick = (event: Event) => {
    
    const anchor = event.target as HTMLAnchorElement;

    if (ManualUtils.isAbsoluteUrl(this.getHref(anchor))) {
      // let the link navigate normally      
    } else {
      this.router.navigateByUrl(this.getHref(anchor));
      // prevent the page reload
      event.preventDefault();
    }
  }

  registerAnchorEventListeners() {
    this.anchors = this.elementRef.nativeElement.querySelectorAll('a');
    log.debug("regisrer anchor event listeners: " + this.anchors.length);
    this.anchors.forEach((anchor: HTMLAnchorElement) => {
      anchor.addEventListener('click', this.handleAnchorClick)
    })
  }

  unregisterAnchorEventListeners() {
    log.debug("unregisrer anchor event listeners: " + this.anchors.length);
    this.anchors.forEach((anchor: HTMLAnchorElement) => {
      anchor.removeEventListener('click', this.handleAnchorClick)
    })
  }

  /**
   * Scroll to given fragment
   *
   * URL fragment may point to a element id e.g. <div id="fragment"> or to a named anchor
   * <a name="fragment">. If there is no fragment, the Angular scrolls to top like a browser would normally
   * do on a page change. 
   *
   * @param {string} fragment
   */
  scrollToFragment(fragment: string) {
    const byId = document.getElementById(fragment);
    const byName = document.getElementsByName(fragment);

    log.debug("scroll to", fragment, byId, byName);

    if (!fragment) {
      log.debug("no fragment");
    } else if (byId) {
      log.debug("fragment is '" + fragment + "' scroll to element", byId);
      byId.scrollIntoView();
    } else if (byName.length > 0) {
      log.debug("fragment is '" + fragment + "' scroll to element", byName[0]);
      byName[0].scrollIntoView();
    } else {
      log.warn("unable to scroll, element not found by id or name", fragment);
    }
  }
}
