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
      expect(component.state.buttonTexts).toEqual(["Show here", "Open in new tab"]);
      expect(urlRequests.length).toBe(0);
    });

    it("shows the size of a large file in the prompt", () => {
      select(11 * 1024 * 1024);

      expect(component.state.message).toContain("This PDF is large (11.0 MB).");
    });

    it("shows the pdf when its url arrives", () => {
      select(1000);
      urlRequests[0].next("http://localhost/file.pdf");

      expect(component.urlReady).toBe(true);
      expect(component.src).toBe("http://localhost/file.pdf");
    });
  });

  describe("prompt buttons", () => {
    beforeEach(() => {
      select(limit + 1);
    });

    it("loads the file with Show here", () => {
      component.onStatusButton("Show here");

      expect(component.state.isLoading()).toBe(true);
      expect(urlRequests.length).toBe(1);
    });

    it("loads the file only once when Show here is clicked twice", () => {
      component.onStatusButton("Show here");
      component.onStatusButton("Show here");

      expect(urlRequests.length).toBe(1);
    });

    it("opens the file in a new tab and keeps the prompt", () => {
      component.onStatusButton("Open in new tab");

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
