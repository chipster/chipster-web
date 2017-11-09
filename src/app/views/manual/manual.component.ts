import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver, Input,
  ViewChild,
  ViewContainerRef
} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {ManualAComponent} from "./manual-components/manual-a.component";
import {ManualLiComponent} from "./manual-components/manual-li.component";
import {ManualUlComponent} from "./manual-components/manual-ul.component";
import {ManualOlComponent} from "./manual-components/manual-ol.component";
import {ManualDivComponent} from "./manual-components/manual-div.component";
import {ManualSpanComponent} from "./manual-components/manual-span.component";
import {ManualUtils} from "./manual-utils";

/**
 * Show HTML files in an Angular app
 *
 * Angular's philosophy of abstracting the DOM and Ahead-of-Time compilation doesn't
 * make it particularly easy to integrate a HTML file. It's possible to show some static
 * content by putting it to <div [innerHtml]="...">, but it's not possible to listen for
 * link click events, unless link's all parent elements are real Angular components.
 *
 * This component goes through the original HTML document and builds a new one where all
 * the parent elements (i.e. elements that might contain a link like 'div') are replaced with
 * an equivalent Angular component. All other elements (like h1, are simply cloned and
 * appended to the Angular UI.
 *
 * Relative links are changed to use the Angular router for page changes. This makes it
 * fast to navigate between the pages as the user doesn't have to wait for the Angular
 * app to load all the time and it's nice to have the current page in the borwser's
 * address bar too.
 *
 * Absolute links are changed to open in a new tab.
 */
@Component({
  selector: 'ch-manual',
  templateUrl: './manual.component.html'
})
export class ManualComponent implements AfterViewInit {

  @Input()
  private page: string;

  private routerPath = 'manual/';
  private assetsPath = 'assets/manual/';

  @ViewChild('container', { read: ViewContainerRef }) viewContainerReference;

  constructor (private http: HttpClient,
               private activatedRoute: ActivatedRoute,
               private componentFactoryResolver: ComponentFactoryResolver) {
  }

  /**
   * Listen for route changes and show the corresponding page
   *
   * Do this in AfterViewInit() because building the html view requres access to DOM.
   */
  ngAfterViewInit() {

    let query;
    this.activatedRoute.url
      .flatMap(() => {
        console.log('route changed', this.activatedRoute.snapshot.url, this.page);
        if (this.page) {
          query = this.page;
        } else {
          // get the current route path
          query = this.activatedRoute.snapshot.url.join('/');
        }

        // get the html file
        return this.getPage(this.assetsPath + query)
      })
      // parse the html
      .map(htmlString => new DOMParser().parseFromString(htmlString, "text/html"))
      // fix the links and image source addresses
      .map(htmlDoc => this.rewrite(htmlDoc, query))
      // show
      .map(html => this.viewPage(html, this.activatedRoute.snapshot.fragment))
      .subscribe();
  }

  /**
   * Show the html on the current page and scroll to the given fragment
   *
   * @param {string} htmlDoc
   * @param {string} fragment
   */
  viewPage(htmlDoc: HTMLDocument, fragment: string) {

    // remove previous page
    this.viewContainerReference.clear();

    // create a root component because angularize() wants one
    const factory = this.componentFactoryResolver.resolveComponentFactory(ManualDivComponent);
    let componentRef = this.viewContainerReference.createComponent(factory);

    this.angularize(htmlDoc, componentRef);

    this.scrollToFragment(fragment);
  }

  /**
   * Scroll to given fragment
   *
   * URL fragment may point to a element id e.g. <div id="fragment"> or to a named anchor
   * <a name="fragment">. If there is no fragment scroll to top like a browser would normally
   * do on a page change. The browser doesn't do it automatically, because technically route
   * change isn't a real page change.
   *
   * @param {string} fragment
   */
  scrollToFragment(fragment: string) {
    let byId = document.getElementById(fragment);
    let byName = document.getElementsByName(fragment);

    console.debug('scroll to', fragment, byId, byName);

    if (!fragment) {
      // show new pages from the start
      window.scroll(null, 0);

    } else if (byId) {
      byId.scrollIntoView();

    } else if (byName.length > 0) {
      byName[0].scrollIntoView();

    } else {
      console.log('unable to scroll, element not found by id or name', fragment);
    }
  }

  /**
   * Rebuild the html document tree using Angular components
   *
   * Use Angular components for everything that might contain a link, otherwise they don't work.
   *
   * @param sourceDoc
   * @param targetComponentRef
   */
  angularize(sourceDoc, targetComponentRef) {

    // process the children of these tags, but the tag itself can be omitted
    const keepChilren = new Set(['HTML', 'BODY']);

    // skip these tags and don't process their children
    const skip = new Set(['HEAD', 'TITLE']);

    // these tags are simply cloned and links inside these won't use the Angular router
    const clone = new Set(['#TEXT', '#COMMENT', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'B', 'U', 'I', 'BR', 'HR', 'IMG']);

    // replace the original tag with a Angular component to be able to listen for link clicks
    const components = new Map<string, any>([
      ['A', ManualAComponent],
      ['UL', ManualUlComponent],
      ['OL', ManualOlComponent],
      ['LI', ManualLiComponent],
      ['A', ManualAComponent],
      ['DIV', ManualDivComponent],
      ['SPAN', ManualSpanComponent],
    ]);

    // iterate children
    for (let i = 0; i < sourceDoc.childNodes.length; i++) {

      let element = sourceDoc.childNodes[i];
      let nodeName = element.nodeName.toUpperCase();

      if (keepChilren.has(nodeName)) {
        // omit the tag, process children
        this.angularize(element, targetComponentRef);

      } else if (skip.has(nodeName)) {
        // skip the tag and it's children
        continue;

      } else if (components.has(nodeName)) {
        // create an Angular component
        let component = components.get(element.tagName);
        let componentRef = this.addComponent(component, targetComponentRef);

        // give attributes of the original element as an input for the new component
        componentRef.instance.attributes = element.attributes;

        // process children
        this.angularize(element, componentRef);

      } else if (clone.has(nodeName)) {
        // clone element and it's children
        this.addElement(element, targetComponentRef);

      } else {
        // somenthing else
        console.log('unknown element', nodeName, element);
        // try to replace the component with div
        let componentRef = this.addComponent(ManualDivComponent, targetComponentRef);
        this.angularize(element, componentRef);
      }
    }
  }

  /**
   * Clone the DOM element and add it next to the targetComponentRef
   *
   * @param element
   * @param targetComponentRef
   */
  addElement(element, targetComponentRef) {
    let clone = element.cloneNode(true);

    // Wrap the element into an additional span component to keep the content in order. Otherwise all the
    // remaining components will be put above these native elements.
    let componentRef = this.addComponent(ManualSpanComponent, targetComponentRef);
    componentRef.instance.appendChild(clone);
  }

  /**
   * Create an Angular component and add it next to the targetComponentRef
   *
   * @param component
   * @param targetComponentRef
   * @returns {ComponentRef<any>}
   */
  addComponent(component, targetComponentRef) {

    const factory = this.componentFactoryResolver.resolveComponentFactory(component);
    return targetComponentRef.instance.viewContainerRef.createComponent(factory);
  }

  /**
   * Fetch a html page and parse it
   *
   * @param path
   * @returns {Observable<HTMLDocument>}
   */
  getPage(path): Observable<string> {

    console.log('GET', path);

    return this.http.get(path, {responseType: 'text'})
      // replace missing pages with nicer message
      .catch(err => {
        if (err.status === 404) {
          return Observable.of('<html><body>Page not found</body></html>');
        } else {
          throw err;
        }
      })
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

    let links = htmlDoc.getElementsByTagName('a');
    Array.from(links).forEach(link => {

      // use getAttribute(), because link.href converts the url to absolute
      let href = link.getAttribute('href');

      if (link.name) {
        // link target, nothing to do

      } else if (ManualUtils.isAbsoluteUrl(href)) {
        // open absolute urls in a new tab
        link.target = '_blank';

      } else if (href.startsWith('#')) {
        // relative urls navigate with the Angular router
        // router needs the page path when navigating within the page
        link.href = this.routerPath + path + href;

      } else {
        // relative urls navigate with the Angular router
        link.href = this.routerPath + href;
      }
    });

    let imgs = htmlDoc.getElementsByTagName('img');
    Array.from(imgs).forEach(img => {

      let src = img.getAttribute('src');
      img.src = this.assetsPath + src;
    });

    return htmlDoc;
  }
}
