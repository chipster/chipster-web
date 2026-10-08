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
export class PdfViewerService {
  open(target: HTMLElement, url: string, name: string): PdfViewer {
    let container: EmbedPdfContainer | undefined;
    let closed = false;

    const loaded = (async () => {
      const { default: EmbedPDF } = await import("@embedpdf/snippet");
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
        theme: { preference: "light" },
        tabBar: "never",
        disabledCategories,
      };
      container = EmbedPDF.init({ type: "container", target, ...config });

      const registry = await container.registry;
      if (closed) {
        return;
      }
      const documentManager = registry.getPlugin<DocumentManagerPlugin>("document-manager").provides();

      // file-broker doesn't answer range requests with 206 Partial Content, so download it at once
      const response = await documentManager.openDocumentUrl({ url, name, mode: "full-fetch" }).toPromise();
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
        container?.remove();
      },
    };
  }
}
