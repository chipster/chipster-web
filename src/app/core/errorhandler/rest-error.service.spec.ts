import { HttpErrorResponse } from "@angular/common/http";
import { ErrorMessage } from "./errormessage";
import { ErrorService } from "./error.service";
import { RestErrorService } from "./rest-error.service";

describe("RestErrorService", () => {
  let service: RestErrorService;
  let shown: ErrorMessage | null;

  beforeEach(() => {
    shown = null;
    const errorServiceStub = {
      showErrorObject: (errorMessage: ErrorMessage) => {
        shown = errorMessage;
      },
    } as unknown as ErrorService;
    service = new RestErrorService(errorServiceStub);
  });

  describe("showError with a 400 Bad Request", () => {
    it("surfaces a plain-text reason in resp.error", () => {
      const resp = new HttpErrorResponse({
        status: 400,
        error: "session has reached the maximum of 100 labels",
      });

      service.showError("Copy selection failed", resp);

      expect(shown.title).toBe("Copy selection failed");
      expect(shown.msg).toBe("session has reached the maximum of 100 labels");
    });

    it("surfaces a reason wrapped in resp.error.text (failed JSON parse)", () => {
      const resp = new HttpErrorResponse({
        status: 400,
        error: { error: new SyntaxError("bad json"), text: "session has reached the maximum of 100 labels" },
      });

      service.showError("Copy selection failed", resp);

      expect(shown.title).toBe("Copy selection failed");
      expect(shown.msg).toBe("session has reached the maximum of 100 labels");
    });

    it("falls back to 'Bad request' when the body is empty", () => {
      const resp = new HttpErrorResponse({ status: 400, error: "   " });

      service.showError("Copy selection failed", resp);

      expect(shown.title).toBe("Copy selection failed");
      expect(shown.msg).toBe("Bad request");
    });
  });

  describe("showError with other statuses", () => {
    it("keeps the existing 'Not found' title for a 404", () => {
      const resp = new HttpErrorResponse({ status: 404, error: "missing" });

      service.showError("Loading failed", resp);

      expect(shown.title).toBe("Not found");
    });

    it("keeps the existing 'Authentication failed' title for a 403", () => {
      const resp = new HttpErrorResponse({ status: 403, error: "forbidden" });

      service.showError("Loading failed", resp);

      expect(shown.title).toBe("Authentication failed");
    });
  });
});
