/**
 * Utility for Flutter WebView detection and bridge readiness.
 */

export function isInWebView(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Explicit query parameter ?webview=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("webview") === "true") {
    return true;
  }

  // 2. User-Agent inspection (standard for Android WebView & iOS WKWebView)
  const userAgent = window.navigator.userAgent || "";
  const isAndroidWV = /wv/.test(userAgent) || /Version\/[\d.]+.*Chrome/.test(userAgent);
  const isIOSWV = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent);
  const isFlutterWV = /Flutter/i.test(userAgent);

  // 3. Injected Javascript channel check (e.g. FlutterInAppWebView)
  const hasFlutterBridge = Boolean(
    (window as unknown as { Flutter?: unknown; flutter_inappwebview?: unknown }).Flutter ||
    (window as unknown as { Flutter?: unknown; flutter_inappwebview?: unknown }).flutter_inappwebview
  );

  return isAndroidWV || isIOSWV || isFlutterWV || hasFlutterBridge;
}
