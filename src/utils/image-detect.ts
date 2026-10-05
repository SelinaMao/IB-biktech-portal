export function isImageLoaded(
  url: string,
  callback: (success: boolean) => void,
): string {
  const img = new Image();

  // Triggered when the image is successfully loaded
  img.onload = () => {
    callback(true); // Image loaded successfully
  };

  // Triggered when there's an error loading the image
  img.onerror = () => {
    callback(false); // Image failed to load
  };

  // Start loading the image
  img.src = url;

  return url;
}
