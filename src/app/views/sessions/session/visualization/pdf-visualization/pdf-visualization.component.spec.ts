import { ElementRef } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { State } from "../../../../../model/loadstate";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { SessionDataService } from "../../session-data.service";
import { PdfViewerService } from "./pdf-viewer.service";
import { PdfVisualizationComponent } from "./pdf-visualization.component";

// a viewer opened by the component, which the test loads or fails
interface OpenedViewer {
  url: string;
  name: string;
  closed: boolean;
  load(): Promise<void>;
  fail(error: Error): Promise<void>;
}

describe("PdfVisualizationComponent", () => {
  const limit = 10 * 1024 * 1024;

  let component: PdfVisualizationComponent;
  let urlRequests: Subject<string>[];
  let openedInNewTab: Dataset[];
  let shownErrors: string[];
  let viewers: OpenedViewer[];

  beforeEach(() => {
    urlRequests = [];
    openedInNewTab = [];
    shownErrors = [];
    viewers = [];

    const sessionDataServiceStub = {
      getDatasetUrl: () => {
        const request = new Subject<string>();
        urlRequests.push(request);
        return request;
      },
      openNewTab: (dataset: Dataset) => {
        openedInNewTab.push(dataset);
      },
    } as unknown as SessionDataService;

    const restErrorServiceStub = {
      showError: (message: string) => {
        shownErrors.push(message);
      },
    } as unknown as RestErrorService;

    const pdfViewerServiceStub = {
      open: (target: HTMLElement, url: string, name: string) => {
        let resolve: () => void;
        let reject: (error: Error) => void;
        const loaded = new Promise<void>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        const viewer: OpenedViewer = {
          url,
          name,
          closed: false,
          // the component sees the result after its own promise callbacks have run
          load: () => {
            resolve();
            return loaded.then(() => undefined);
          },
          fail: (error: Error) => {
            reject(error);
            return loaded.catch(() => undefined);
          },
        };
        viewers.push(viewer);
        return {
          loaded,
          close: () => {
            viewer.closed = true;
          },
        };
      },
    } as unknown as PdfViewerService;

    component = new PdfVisualizationComponent(
      sessionDataServiceStub,
      restErrorServiceStub,
      new BytesPipe(),
      pdfViewerServiceStub,
    );
    // the template isn't rendered in these tests, and the stub viewer doesn't need a real element
    component.viewerContainer = new ElementRef({} as HTMLElement);
  });

  function select(size: number) {
    component.dataset = { datasetId: "d1", name: "file.pdf", size } as Dataset;
    component.ngOnChanges();
  }

  function buttonTexts(): string[] {
    return component.state.buttons.map((button) => button.text);
  }

  // like the status component does, when the button with this text is clicked
  function click(buttonText: string) {
    const button = component.state.buttons.find((candidate) => candidate.text === buttonText);
    expect(button, "button " + buttonText).toBeDefined();
    component.onStatusButton(button.action);
  }

  describe("selecting a file", () => {
    it("shows an empty file without loading it", () => {
      select(0);

      expect(component.state.state).toBe(State.EmptyFile);
      expect(urlRequests.length).toBe(0);
    });

    it("loads a file at the limit directly", () => {
      select(limit);

      expect(component.state.isLoading()).toBe(true);
      expect(urlRequests.length).toBe(1);
    });

    it("asks before loading a file over the limit", () => {
      select(limit + 1);

      expect(component.state.isTooLarge()).toBe(true);
      expect(buttonTexts()).toEqual(["Show here", "Open in new tab"]);
      expect(urlRequests.length).toBe(0);
    });

    it("shows the limit and the size of a large file in the prompt", () => {
      select(11 * 1024 * 1024);

      expect(component.state.message).toContain("This PDF is larger than 10 MB (11.0 MB).");
    });

    it("never shows the size of a large file below the limit", () => {
      select(limit + 1);

      expect(component.state.message).toContain("This PDF is larger than 10 MB (10.1 MB).");
    });

    it("opens the pdf in the viewer when its url arrives", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");

      expect(viewers.map((viewer) => [viewer.url, viewer.name])).toEqual([["http://localhost/file.pdf", "file.pdf"]]);
      expect(component.state.isLoading()).toBe(true);
    });

    it("is ready when the viewer has loaded the pdf", async () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");
      await viewers[0].load();

      expect(component.state.isReady()).toBe(true);
    });
  });

  describe("viewer", () => {
    it("is closed when another file is selected", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");

      select(2000);

      expect(viewers[0].closed).toBe(true);
    });

    it("is closed when the visualization is closed", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");

      component.ngOnDestroy();

      expect(viewers[0].closed).toBe(true);
    });

    it("of the previous file doesn't change the state of the next one", async () => {
      select(1000);
      urlRequests[0].next("http://localhost/first.pdf");
      select(2000);
      urlRequests[1].next("http://localhost/second.pdf");

      await viewers[0].load();
      expect(component.state.isLoading()).toBe(true);

      await viewers[0].fail(new Error("closed"));
      expect(component.state.isLoading()).toBe(true);
      expect(shownErrors).toEqual([]);
    });
  });

  describe("prompt buttons", () => {
    beforeEach(() => {
      select(limit + 1);
    });

    it("loads the file with Show here", () => {
      click("Show here");

      expect(component.state.isLoading()).toBe(true);
      expect(urlRequests.length).toBe(1);
    });

    it("loads the file only once when Show here is clicked twice", () => {
      // the button is gone after the first click, but a second click may be on its way already
      const showHere = component.state.buttons[0];
      component.onStatusButton(showHere.action);
      component.onStatusButton(showHere.action);

      expect(urlRequests.length).toBe(1);
    });

    it("opens the file in a new tab and keeps the prompt", () => {
      click("Open in new tab");

      expect(openedInNewTab).toEqual([component.dataset]);
      expect(component.state.isTooLarge()).toBe(true);
      expect(urlRequests.length).toBe(0);
    });
  });

  describe("failures", () => {
    it("ends in the fail state when the url request fails", () => {
      select(1000);
      urlRequests[0].error(new Error("test failure"));

      expect(component.state.isFail()).toBe(true);
      expect(component.state.message).toBe("Loading pdf file failed");
      expect(shownErrors).toEqual(["Loading pdf file failed"]);
    });

    it("offers to try again or to open the file in a new tab after a failure", () => {
      select(limit + 1);
      click("Show here");
      urlRequests[0].error(new Error("test failure"));

      expect(buttonTexts()).toEqual(["Try again", "Open in new tab"]);

      click("Open in new tab");
      expect(openedInNewTab).toEqual([component.dataset]);
      expect(component.state.isFail()).toBe(true);

      click("Try again");
      expect(component.state.isLoading()).toBe(true);
      expect(urlRequests.length).toBe(2);
    });

    it("opens a new viewer when trying again", async () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");
      await viewers[0].fail(new Error("test failure"));

      click("Try again");
      urlRequests[1].next("http://localhost/file.pdf");

      expect(viewers.length).toBe(2);
      expect(viewers[1].closed).toBe(false);
      await viewers[1].load();
      expect(component.state.isReady()).toBe(true);
    });

    it("ends in the fail state when the pdf viewer fails", async () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");
      await viewers[0].fail(new Error("test failure"));

      expect(component.state.isFail()).toBe(true);
      expect(component.state.message).toBe("Loading pdf file failed");
      expect(viewers[0].closed).toBe(true);
      expect(shownErrors).toEqual(["Loading pdf file failed"]);
    });
  });
});
