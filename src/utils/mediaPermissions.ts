/**
 * Client-Side Media Permissions & Hardware Access Manager
 *
 * Guarantees zero global camera/microphone permission requests at startup or page load.
 * All permission queries use passive non-intrusive APIs (navigator.permissions.query),
 * and media device requests (getUserMedia) are strictly encapsulated within individual
 * components when a user explicitly initiates a recording or transcription feature.
 */

export type PermissionStateResult = 'granted' | 'prompt' | 'denied' | 'unsupported';

/**
 * Passively check permission status without triggering any browser prompt or dialog.
 */
export async function queryMediaPermission(
  type: 'camera' | 'microphone'
): Promise<PermissionStateResult> {
  if (typeof window === 'undefined' || !navigator || !navigator.permissions) {
    return 'unsupported';
  }

  try {
    // Standard Chromium / WebKit permission name descriptor
    const permissionName = type === 'camera' ? ('camera' as PermissionName) : ('microphone' as PermissionName);
    const status = await navigator.permissions.query({ name: permissionName });
    return status.state as PermissionStateResult;
  } catch {
    // Firefox, Safari, or older engines may reject permission descriptor for camera/microphone
    return 'unsupported';
  }
}

/**
 * Actively request user media stream ONLY when explicitly triggered by a user action (click).
 */
export async function requestMediaAccess(constraints: MediaStreamConstraints): Promise<{
  stream: MediaStream | null;
  error: string | null;
  permissionDenied: boolean;
}> {
  if (typeof window === 'undefined' || !navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      stream: null,
      error: 'MediaDevices hardware API is not supported in this browser environment.',
      permissionDenied: false,
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return {
      stream,
      error: null,
      permissionDenied: false,
    };
  } catch (err: any) {
    const isDenied =
      err.name === 'NotAllowedError' ||
      err.name === 'PermissionDeniedError' ||
      err.message?.toLowerCase().includes('permission') ||
      err.message?.toLowerCase().includes('denied');

    const errorMessage = isDenied
      ? `Permission denied: ${
          constraints.video && constraints.audio
            ? 'Camera and Microphone access was blocked'
            : constraints.video
            ? 'Camera access was blocked'
            : 'Microphone access was blocked'
        }. Please click the lock icon in your browser address bar to allow access and try again.`
      : err.message || 'Failed to acquire media stream.';

    return {
      stream: null,
      error: errorMessage,
      permissionDenied: isDenied,
    };
  }
}
