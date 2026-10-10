import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { State } from "../../../../../model/loadstate";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { SessionDataService } from "../../session-data.service";
import { PdfVisualizationComponent } from "./pdf-visualization.component";

describe("PdfVisualizationComponent", () => {
  const limit = 10 * 1024 * 1024;

  let component: PdfVisualizationComponent;
  let urlRequests: Subject<string>[];
  let openedInNewTab: Dataset[];
  let shownErrors: string[];

  beforeEach(() => {
    urlRequests = [];
    openedInNewTab = [];
    shownErrors = [];

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

    component = new PdfVisualizationComponent(sessionDataServiceStub, restErrorServiceStub, new BytesPipe());
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

    it("shows the pdf when its url arrives", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");

      expect(component.urlReady).toBe(true);
      expect(component.src).toBe("http://localhost/file.pdf");
    });

    it("is ready when the pdf is loaded", () => {
      select(1000);
      component.pdfLoadComplete({ numPages: 6 });

      expect(component.state.isReady()).toBe(true);
      expect(component.totalPages).toBe(6);
    });
  });

  describe("pages", () => {
    beforeEach(() => {
      select(1000);
      component.pdfLoadComplete({ numPages: 3 });
    });

    it("moves between the pages", () => {
      component.nextPage();
      component.nextPage();
      component.nextPage();
      expect(component.page).toBe(3);

      component.previousPage();
      expect(component.page).toBe(2);
    });

    it("follows the page when pdf.js changes it, for example for a link in the pdf", () => {
      component.onPageChange(3);

      expect(component.page).toBe(3);
    });

    it("switches between one page and all pages", () => {
      component.toggleShowAll();
      expect(component.showAll).toBe(true);
      expect(component.showAllButtonText).toBe("Show single page");

      component.toggleShowAll();
      expect(component.showAll).toBe(false);
      expect(component.showAllButtonText).toBe("Show all pages");
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

    it("starts again from nothing when trying again", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");
      component.onProgress({ loaded: 600, total: 1000 });
      component.height = 6000;
      component.pdfLoadFailed(new Error("test failure"));

      click("Try again");

      expect(component.loadedBytes).toBe(0);
      expect(component.totalBytes).toBe(0);
      expect(component.height).toBe(500);
      expect(component.urlReady).toBe(false);
    });

    it("ends in the fail state when the pdf viewer fails", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");
      component.pdfLoadFailed(new Error("test failure"));

      expect(component.state.isFail()).toBe(true);
      expect(component.state.message).toBe("Loading pdf file failed");
      expect(component.urlReady).toBe(false);
      expect(shownErrors).toEqual(["Loading pdf file failed"]);
    });
  });
});
