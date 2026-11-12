import { inflateRawSync } from "node:zlib";

/*
 * The files of a zip, by their path in the zip. Enough for the session files
 * of session-worker: stored or deflated entries, no zip64 or encryption. The
 * sizes are read from the central directory, because session-worker streams
 * the zip and the local headers don't have them.
 */
export function readZip(zip: Buffer): Map<string, Buffer> {
  const endOfCentralDirectory = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOfCentralDirectory < 0) {
    throw new Error("not a zip file");
  }
  const count = zip.readUInt16LE(endOfCentralDirectory + 10);
  let header = zip.readUInt32LE(endOfCentralDirectory + 16);

  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(header) !== 0x02014b50) {
      throw new Error(`no central directory header at ${header}`);
    }
    const method = zip.readUInt16LE(header + 10);
    const compressedSize = zip.readUInt32LE(header + 20);
    const nameLength = zip.readUInt16LE(header + 28);
    const extraLength = zip.readUInt16LE(header + 30);
    const commentLength = zip.readUInt16LE(header + 32);
    const localHeader = zip.readUInt32LE(header + 42);
    const name = zip.toString("utf8", header + 46, header + 46 + nameLength);

    const dataStart = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
    const data = zip.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) {
      files.set(name, data);
    } else if (method === 8) {
      files.set(name, inflateRawSync(data));
    } else {
      throw new Error(`unsupported compression method ${method} in ${name}`);
    }
    header += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}
