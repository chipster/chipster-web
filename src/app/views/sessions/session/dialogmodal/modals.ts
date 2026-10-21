/*
 * The modals that DialogModalService opens. It loads this file with a dynamic import(), so
 * that the modals and the components of their templates are out of its static import graph:
 * see the comment there.
 */
export { JobsModalComponent } from "../jobs-modal/jobs-modal.component";
export { BooleanModalComponent } from "./booleanmodal/booleanmodal.component";
export { ChoiceModalComponent } from "./choicemodal/choice-modal.component";
export { DeleteFilesModalComponent } from "./delete-files-modal/delete-files-modal.component";
export { DownloadFromUrlModalComponent } from "./download-from-url-modal/download-from-url.component";
export { DropdownModalComponent } from "./dropdownmodal/dropdown-modal.component";
export { EditNewsModalComponent } from "./edit-news-modal/edit-news-modal.component";
export { NewsModalComponent } from "./news-modal/news-modal.component";
export { NotesModalComponent } from "./notes-modal/notes-modal.component";
export { NotificationModalComponent } from "./notification-modal/notification-modal.component";
export { PreModalComponent } from "./pre-modal/pre-modal.component";
export { SharingModalComponent } from "./share-session-modal/share-session-modal.component";
export { SpinnerModalComponent } from "./spinnermodal/spinnermodal.component";
export { StringModalComponent } from "./stringmodal/stringmodal.component";
export { TempCopyModalComponent } from "./temp-copy-modal/temp-copy-modal.component";
