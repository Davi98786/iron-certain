/**
 * Maps technical error objects or strings to user-friendly messages.
 */
export function getFriendlyErrorMessage(error: any): string {
  const msg = error?.message || error?.toString() || "Unknown error";

  // Microphone / Permissions
  if (msg.includes("Permission denied") || msg.includes("NotAllowedError") || msg.includes("permission")) {
    return "Microphone access denied. Please grant permission in your browser settings.";
  }
  if (msg.includes("NotFoundError") || msg.includes("device not found")) {
    return "Microphone not found. Please ensure your device is connected.";
  }

  // API / Billing / Quota
  if (msg.includes("403") || msg.includes("API key")) {
    return "Access denied. Please check your API key and quota limits.";
  }
  if (msg.includes("429")) {
    return "System is busy (Too Many Requests). Please try again in a moment.";
  }
  if (msg.includes("500") || msg.includes("503") || msg.includes("overloaded")) {
    return "Google Gemini service is currently overloaded. Please try again later.";
  }
  if (msg.includes("billing") || msg.includes("quota")) {
    return "Billing check failed. Please ensure your project has billing enabled.";
  }

  // Specific Model Issues
  if (msg.includes("Requested entity was not found") && (msg.includes("video") || msg.includes("veo"))) {
    return "To generate video with Veo, you must select a Paid API Key (GCP Project).";
  }
  
  // Safety / content
  if (msg.includes("SAFETY")) {
    return "The request was blocked due to safety settings.";
  }

  // Browser Support
  if (msg.includes("AudioContext") || msg.includes("getUserMedia")) {
    return "Your browser does not support required audio features. Please use Chrome, Edge, or Safari.";
  }
  
  // Network
  if (msg.includes("fetch") || msg.includes("network")) {
    return "Network error. Please check your internet connection.";
  }

  return `Error: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`;
}
