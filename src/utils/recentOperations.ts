export interface RecentOperation {
  id: string;
  name: string;
  type: 'PDF Compression' | 'WebP Conversion' | 'Image to PDF';
  originalSize: string;
  newSize: string;
  timestamp: string;
  downloadName: string;
  hasBlobUrl?: boolean;
}

// Session-only in-memory storage for file download URLs/dataURLs
const sessionDownloadUrls: Record<string, string> = {};

export const getSessionDownloadUrl = (id: string): string | null => {
  return sessionDownloadUrls[id] || null;
};

export const getRecentOperations = (): RecentOperation[] => {
  try {
    const data = localStorage.getItem('apex_recent_ops');
    if (!data) return [];
    const ops = JSON.parse(data) as RecentOperation[];
    return ops.map(op => ({
      ...op,
      hasBlobUrl: !!sessionDownloadUrls[op.id]
    }));
  } catch (e) {
    console.error('Failed to retrieve recent operations from localStorage', e);
    return [];
  }
};

export const addRecentOperation = (
  name: string,
  type: 'PDF Compression' | 'WebP Conversion' | 'Image to PDF',
  originalSize: string,
  newSize: string,
  downloadName: string,
  downloadUrl: string
) => {
  try {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store url/base64 in memory for the current active browser session
    sessionDownloadUrls[id] = downloadUrl;

    const newOp: RecentOperation = {
      id,
      name,
      type,
      originalSize,
      newSize,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      downloadName
    };

    const currentOps = getRecentOperations();
    const updatedOps = [newOp, ...currentOps].slice(0, 5);

    localStorage.setItem('apex_recent_ops', JSON.stringify(updatedOps));

    // Dispatch custom event to trigger reactive re-renders across the dashboard
    window.dispatchEvent(new CustomEvent('apex_recent_ops_updated'));
  } catch (e) {
    console.error('Failed to persist recent operation to localStorage', e);
  }
};
