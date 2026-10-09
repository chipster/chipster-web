import { Injectable } from "@angular/core";
import type { DocumentManagerPlugin, EmbedPdfContainer, PDFViewerConfig } from "@embedpdf/snippet";

export interface PdfViewer {
  // resolves when the pdf is shown, rejects with the reason when it can't be
  loaded: Promise<void>;
  // resolves if PDFium crashes after the pdf is shown, usually because a page needs more memory than it can have
  crashed: Promise<void>;
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
export class PdfViewerService {
  // onProgress gets the number of bytes downloaded so far
  open(target: HTMLElement, url: string, name: string, onProgress: (loadedBytes: number) => void): PdfViewer {
    let container: EmbedPdfContainer | undefined;
    let closed = false;
    const abortController = new AbortController();
    let crash: () => void;
    const crashed = new Promise<void>((resolve) => {
      crash = resolve;
    });

    const loaded = (async () => {
      // the file is downloaded while the library loads
      const [buffer, { default: EmbedPDF, LockModeType }] = await Promise.all([
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
        theme: { preference: "light" },
        tabBar: "never",
        disabledCategories,
      };
      container = EmbedPDF.init({ type: "container", target, ...config });

      const registry = await container.registry;
      if (closed) {
        return;
      }
      this.watchForCrash(registry.getEngine(), () => crash());
      const documentManager = registry.getPlugin<DocumentManagerPlugin>("document-manager").provides();

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
      crashed,
      close: () => {
        closed = true;
        abortController.abort();
        container?.remove();
      },
    };
  }

  /*
   * PDFium runs in WebAssembly, which has at most 2 GB of memory. When a page needs more,
   * PDFium aborts, and every call after that fails with the abort message. The viewer
   * doesn't tell about the failures, so watch the results of the calls to its engine.
   */
  private watchForCrash(engine: object, onCrash: () => void) {
    let crashed = false;
    const prototype = Object.getPrototypeOf(engine);
    for (const name of Object.getOwnPropertyNames(prototype)) {
      const method = Object.getOwnPropertyDescriptor(prototype, name).value;
      if (name === "constructor" || typeof method !== "function") {
        continue;
      }
      engine[name] = (...args: unknown[]) => {
        const result = method.apply(engine, args);
        // the engine returns tasks of EmbedPDF
        result?.wait?.(
          () => undefined,
          (error: { type: string; reason?: { message?: string } }) => {
            if (!crashed && error?.type === "reject" && String(error.reason?.message).includes("Aborted(")) {
              crashed = true;
              onCrash();
            }
          },
        );
        return result;
      };
    }
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
}
