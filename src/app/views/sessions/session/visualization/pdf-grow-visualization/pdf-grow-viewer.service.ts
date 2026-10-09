// TEMPORARY: a copy of PdfViewerService whose viewer grows with its pages, see PdfGrowVisualizationComponent

import { Injectable } from "@angular/core";
import type { DocumentManagerPlugin, EmbedPdfContainer, PDFViewerConfig } from "@embedpdf/snippet";

export interface PdfViewer {
  // resolves when the pdf is shown, rejects with the reason when it can't be
  loaded: Promise<void>;
  // removes the viewer, which stops its worker too
  close(): void;
}

// PdfErrorCode.Password of EmbedPDF, not imported to keep the library out of the main bundle
const passwordErrorCode = 4;

/*
 * Only viewing makes sense in Chipster, because the changes couldn't be saved
 * back to the dataset. Opening other files would replace the dataset in the view.
 */
const disabledCategories = [
  "annotation",
  "redaction",
  "form",
  "insert",
  "signature",
  "stamp",
  "history",
  "mode-annotate",
  "mode-shapes",
  "mode-insert",
  "mode-form",
  "mode-redact",
  "document-open",
  "document-close",
  "document-protect",
  "panel-comment",
];

/*
 * Shows pdf files with the EmbedPDF snippet, which renders them with PDFium in
 * a web worker and has its own toolbar for zooming, paging and searching.
 *
 * The library is loaded only when the first pdf file is shown.
 */
@Injectable({ providedIn: "root" })
export class PdfGrowViewerService {
  // onProgress gets the number of bytes downloaded so far
  open(target: HTMLElement, url: string, name: string, onProgress: (loadedBytes: number) => void): PdfViewer {
    let container: EmbedPdfContainer | undefined;
    let stopGrowing: (() => void) | undefined;
    let closed = false;
    const abortController = new AbortController();

    const loaded = (async () => {
      // the file is downloaded while the library loads
      const [buffer, { default: EmbedPDF, LockModeType, ZoomMode }] = await Promise.all([
        this.download(url, abortController.signal, onProgress),
        import("@embedpdf/snippet"),
      ]);
      if (closed) {
        return;
      }

      const config: PDFViewerConfig = {
        // the worker is created from a blob, so a relative address wouldn't find the file
        wasmUrl: new URL("assets/embedpdf/pdfium.wasm", document.baseURI).href,
        // no requests to Google Fonts or jsDelivr. The standard pdf fonts are built into PDFium.
        fonts: { ui: null, signature: null },
        fontFallback: null,
        stamp: { manifests: [], defaultLibrary: false },
        // links work only on locked annotations, otherwise a click would select the link for editing
        annotations: { locked: { type: LockModeType.All } },
        // fitting the page would follow the height of the viewer, which follows the pages
        zoom: { defaultZoomLevel: ZoomMode.FitWidth },
        theme: { preference: "light" },
        tabBar: "never",
        disabledCategories,
      };
      container = EmbedPDF.init({ type: "container", target, ...config });
      // the viewer lays out its pages only when it has a height, which then follows the pages
      container.style.display = "block";
      container.style.height = "100vh";

      const registry = await container.registry;
      if (closed) {
        return;
      }
      const documentManager = registry.getPlugin<DocumentManagerPlugin>("document-manager").provides();
      stopGrowing = this.growWithPages(container);

      const response = await documentManager.openDocumentBuffer({ buffer, name }).toPromise();
      try {
        await response.task.toPromise();
      } catch (error) {
        // the viewer asks for the password itself
        if (error?.reason?.code !== passwordErrorCode) {
          throw error;
        }
      }
    })();

    return {
      loaded,
      close: () => {
        closed = true;
        abortController.abort();
        stopGrowing?.();
        container?.remove();
      },
    };
  }

  /*
   * The viewer would download the file itself, but without telling the progress. The
   * whole file is needed at once, because file-broker doesn't answer range requests
   * with 206 Partial Content.
   */
  private async download(
    url: string,
    signal: AbortSignal,
    onProgress: (loadedBytes: number) => void,
  ): Promise<ArrayBuffer> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      // without the url, which has the token of the dataset
      throw new Error("Downloading the pdf file failed: " + response.status + " " + response.statusText);
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      loadedBytes += value.length;
      onProgress(loadedBytes);
    }
    const buffer = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    return buffer.buffer;
  }

  /*
   * The viewer scrolls its pages in an element of its own. Make the viewer as tall as
   * the pages in that element, so that it doesn't scroll, and follow their height when
   * it changes, for example when zooming. The element is there only after the first
   * layout, and it's found by its overflow, so this depends on the structure of the viewer.
   */
  private growWithPages(container: EmbedPdfContainer): () => void {
    let observer: ResizeObserver | undefined;

    const resize = (scroller: HTMLElement, pages: HTMLElement) => {
      const style = getComputedStyle(scroller);
      // the toolbar and everything else around the scrolling element
      const around = container.getBoundingClientRect().height - scroller.clientHeight;
      const height =
        around + pages.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      container.style.height = Math.ceil(height) + "px";
    };

    // wait for the first layout
    const interval = setInterval(() => {
      const scroller = Array.from(container.shadowRoot.querySelectorAll<HTMLElement>("*")).find((element) =>
        ["auto", "scroll"].includes(getComputedStyle(element).overflowY),
      );
      const pages = scroller?.firstElementChild as HTMLElement | null;
      if (pages && pages.getBoundingClientRect().height > 0) {
        clearInterval(interval);
        observer = new ResizeObserver(() => resize(scroller, pages));
        observer.observe(pages);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      observer?.disconnect();
    };
  }
}
