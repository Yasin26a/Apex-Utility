// Reactive Threaded Task Queue Manager
// Persists active conversion items across session views and notifies subscribers

export interface ConversionTask {
  id: string;
  name: string;
  type: 'PDF Compression' | 'WebP Conversion' | 'Image to PDF' | 'Batch Rasterization';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  threads: number;
  speed: number; // Increment factor per tick
  originalSize: string;
  targetSize?: string;
  timestamp: string;
}

const STORAGE_KEY = 'apex_task_queue';

// Get active tasks from local storage
export const getActiveTasks = (): ConversionTask[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as ConversionTask[];
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
    return [];
  }
};

// Save tasks to local storage and dispatch update event
const saveTasks = (tasks: ConversionTask[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('apex_task_queue_updated'));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
};

// Add a new task to the queue
export const addQueueTask = (task: Omit<ConversionTask, 'id' | 'timestamp' | 'progress' | 'status'>): string => {
  const tasks = getActiveTasks();
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const newTask: ConversionTask = {
    ...task,
    id,
    progress: 0,
    status: 'processing',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  saveTasks([newTask, ...tasks]);
  return id;
};

// Update task characteristics or state
export const updateQueueTask = (id: string, updates: Partial<ConversionTask>) => {
  const tasks = getActiveTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
  }
};

// Remove task by ID
export const removeQueueTask = (id: string) => {
  const tasks = getActiveTasks();
  const updated = tasks.filter(t => t.id !== id);
  saveTasks(updated);
};

// Clear all tasks
export const clearQueueTasks = () => {
  saveTasks([]);
};
