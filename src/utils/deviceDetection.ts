export const isMobileDevice = (): boolean => {
  // Check if the device has touch capabilities
  const hasTouchScreen = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  
  // Check if it's a mobile device based on user agent (fallback)
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return hasTouchScreen || isMobileUserAgent;
}; 