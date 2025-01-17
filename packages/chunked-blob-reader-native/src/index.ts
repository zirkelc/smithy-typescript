import { fromBase64 } from "@smithy/util-base64";
/**
 * @internal
 */
export function blobReader(
  blob: Blob,
  onChunk: (chunk: Uint8Array) => void,
  chunkSize: number = 1024 * 1024
): Promise<void> {
  return new Promise((resolve, reject) => {
    /**
     * TODO(react-native): https://github.com/facebook/react-native/issues/34402
     * To drop FileReader in react-native, we need the Blob.arrayBuffer() method to work.
     */
    const fileReader = new FileReader();

    fileReader.onerror = reject;
    fileReader.onabort = reject;

    const size = blob.size;
    let totalBytesRead = 0;

    const read = () => {
      if (totalBytesRead >= size) {
        resolve();
        return;
      }
      fileReader.readAsDataURL(blob.slice(totalBytesRead, Math.min(size, totalBytesRead + chunkSize)));
    };

    fileReader.onload = (event) => {
      const result = (event.target as any).result;
      // reference: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
      // response from readAsDataURL is always prepended with "data:*/*;base64,"
      const dataOffset = result.indexOf(",") + 1;
      const data = result.substring(dataOffset);
      const decoded = fromBase64(data);
      onChunk(decoded);
      totalBytesRead += decoded.byteLength;
      // read the next block
      read();
    };

    // kick off the read
    read();
  });
}
