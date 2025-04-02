export function isSafariBrowser(): boolean {
  // Check if userAgent contains 'Safari' but not 'Chrome' (as Chrome also includes Safari in its UA)
  // Also exclude Edge, which might contain both 'Chrome' and 'Safari'
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.indexOf('safari') !== -1 && 
    userAgent.indexOf('chrome') === -1 && 
    userAgent.indexOf('edg') === -1
  );
} 