export class ManualUtils {
  static isAbsoluteUrl(url: string) {
    return url.indexOf('://') !== -1;
  }
}
