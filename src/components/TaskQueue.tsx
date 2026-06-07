import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Play, Pause, X, Trash2, Plus, Sparkles, AlertCircle, 
  CheckCircle2, RefreshCw, Zap, Sliders, ChevronDown, Clock, Activity
} from 'lucide-react';
import { 
  getActiveTasks, updateQueueTask, removeQueueTask, 
  clearQueueTasks, addQueueTask, ConversionTask 
} from '../utils/taskQueue';
import { addRecentOperation } from '../utils/recentOperations';

export default function TaskQueue() {
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [workerThreads, setWorkerThreads] = useState(4);
  const [globalSpeed, setGlobalSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [isWorkerClusterActive, setIsWorkerClusterActive] = useState(true);

  // Load initial task queue
  useEffect(() => {
    setTasks(getActiveTasks());

    const handleTaskUpdate = () => {
      setTasks(getActiveTasks());
    };

    window.addEventListener('apex_task_queue_updated', handleTaskUpdate);
    return () => {
      window.removeEventListener('apex_task_queue_updated', handleTaskUpdate);
    };
  }, []);

  // background simulation loop processor
  useEffect(() => {
    if (!isWorkerClusterActive) return;

    const interval = setInterval(() => {
      const activeTasks = getActiveTasks();
      let hasUpdates = false;

      activeTasks.forEach((task) => {
        if (task.status === 'processing') {
          hasUpdates = true;
          // Progress speed scales with threads (more threads = slightly faster) and global speed slider
          const threadBonus = 1 + (workerThreads - 1) * 0.15;
          const randomIncr = (Math.random() * task.speed + 1) * threadBonus * globalSpeed;
          const nextProgress = Math.min(task.progress + randomIncr, 100);

          if (nextProgress >= 100) {
            // Task has completed! Add it to the persistent recent operations sandbox ledger
            const finishedSizeNum = Math.round(parseFloat(task.originalSize) * (0.3 + Math.random() * 0.4));
            const finishedSizeStr = `${finishedSizeNum.toFixed(1)} MB`;
            
            // Format some mock but highly specific download file names based on original naming
            const extMap: Record<string, string> = {
              'PDF Compression': '_compressed.pdf',
              'WebP Conversion': '_optimized.gif',
              'Image to PDF': '_compiled.pdf',
              'Batch Rasterization': '_rasterized.png'
            };
            const downloadSuffix = extMap[task.type] || '_converted.bin';
            const downloadName = task.name.substring(0, task.name.lastIndexOf('.')) || task.name;

            // Save inside persistent system ledger
            const ledgerType = task.type === 'Batch Rasterization' ? 'WebP Conversion' : task.type;
            addRecentOperation(
              task.name,
              ledgerType,
              task.originalSize,
              finishedSizeStr,
              `${downloadName}${downloadSuffix}`,
              'data:application/pdf;base64,JVBERi0xLjQKJ...' // compliant mock asset payload representing WASM memory block
            );

            // Update local task to completed
            updateQueueTask(task.id, {
              status: 'completed',
              progress: 100,
              targetSize: finishedSizeStr
            });
          } else {
            // Simply advance the progress percentage bar
            updateQueueTask(task.id, {
              progress: Math.round(nextProgress * 10) / 10
            });
          }
        }
      });

    }, 800); // stable tick rate to avoid CPU overhead

    return () => clearInterval(interval);
  }, [isWorkerClusterActive, workerThreads, globalSpeed]);

  // Spawn new conversions (either user triggered bulk simulations or mock heavy tasks)
  const spawnSimulatedTask = (presetType?: string) => {
    const fileNames = [
      'product_catalog_ultra.pdf',
      'q3_marketing_banner.webp',
      'developer_system_telemetry.json',
      'apex_brand_styleguide.pdf',
      'customer_conversion_funnel.webp',
      'server_operations_log.txt'
    ];
    const formats: Array<ConversionTask['type']> = [
      'PDF Compression',
      'WebP Conversion',
      'Image to PDF',
      'Batch Rasterization'
    ];

    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const chosenType = (presetType as any) || formats[Math.floor(Math.random() * formats.length)];
    const isBig = Math.random() > 0.5;
    const randomSize = isBig ? `${(12 + Math.random() * 45).toFixed(1)} MB` : `${(1 + Math.random() * 8).toFixed(1)} MB`;
    
    // speed represents progress advance per tick
    const baseSpeed = ChosenSpeed(chosenType);

    addQueueTask({
      name: `apex_sync_${randomName}`,
      type: chosenType,
      originalSize: randomSize,
      threads: workerThreads,
      speed: baseSpeed
    });
  };

  const ChosenSpeed = (type: string) => {
    switch (type) {
      case 'PDF Compression': return 4 + Math.random() * 5;
      case 'WebP Conversion': return 8 + Math.random() * 10;
      case 'Image to PDF': return 6 + Math.random() * 8;
      default: return 5 + Math.random() * 6;
    }
  };

  const spawnBatchSimulations = () => {
    const batch = [
      { name: 'batch_payload_payload_01.png', type: 'Image to PDF' as const, size: '8.4 MB', speed: 8 },
      { name: 'cloud_architectural_spec_2026.pdf', type: 'PDF Compression' as const, size: '42.9 MB', speed: 3 },
      { name: 'advertising_carousel_motion.webp', type: 'WebP Conversion' as const, size: '19.1 MB', speed: 12 },
      { name: 'kubernetes_node_state_ledger.json', type: 'Batch Rasterization' as const, size: '2.4 MB', speed: 15 }
    ];

    batch.forEach(item => {
      addQueueTask({
        name: item.name,
        type: item.type,
        originalSize: item.size,
        threads: workerThreads,
        speed: item.speed
      });
    });
  };

  const toggleTaskStatus = (task: ConversionTask) => {
    if (task.status === 'processing') {
      updateQueueTask(task.id, { status: 'paused' });
    } else if (task.status === 'paused') {
      updateQueueTask(task.id, { status: 'processing' });
    }
  };

  const currentProcessingCount = tasks.filter(t => t.status === 'processing').length;
  const currentPendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div id="apex-file-task-queue" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-brand-border/20 pb-5">
        <div className="space-y-1.5 flex-1 select-none">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand transition-colors duration-500 animate-pulse" />
            <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">Simultaneous WASM Worker Queue</h2>
          </div>
          <p className="font-sans text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Multi-threaded compiler control center. Tracks file packaging, lossless compression chains, and offline asset compilations executing simultaneously inside sandbox workers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={spawnBatchSimulations}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-brand text-zinc-950 text-xs font-heading font-extrabold tracking-wider uppercase hover:bg-brand/90 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer shadow-md select-none border border-transparent"
          >
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
            <span>Simulate 4x Batch Job</span>
          </button>
          
          <button
            onClick={() => spawnSimulatedTask()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-zinc-950 border border-zinc-800/80 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer shadow-md select-none"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Single Worker Task</span>
          </button>

          {tasks.length > 0 && (
            <button
              onClick={clearQueueTasks}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-zinc-950 border border-zinc-850 text-xs font-mono font-bold text-zinc-500 hover:text-red-400 hover:border-red-950/40 transition-all cursor-pointer shadow-md select-none"
              title="Clean all completed/canceled jobs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Flush Thread Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Hardware Matrix Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        {/* Metric 1: Dedicated Threads Slider */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand" />
              WASM Thread Allocation
            </span>
            <span className="text-white font-bold">{workerThreads} cores</span>
          </div>
          <div className="space-y-1">
            <input 
              type="range" 
              min="1" 
              max="16" 
              value={workerThreads}
              onChange={(e) => setWorkerThreads(Number(e.target.value))}
              className="w-full accent-brand h-1 bg-zinc-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
              <span>1 Core (Eco)</span>
              <span>16 Cores (Max)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Speed Booster Controller */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Clock Multiplier State
            </span>
            <span className="text-white font-bold">{globalSpeed}x speed</span>
          </div>
          <div className="flex items-center gap-1 bg-[#09090c] p-1.5 rounded-lg border border-zinc-900">
            {([1, 2, 5, 10] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setGlobalSpeed(speed)}
                className={`flex-1 py-1 px-1 rounded font-mono font-extrabold text-[10px] text-center transition-all cursor-pointer ${
                  globalSpeed === speed 
                    ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-500/25' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Metric 3: Cluster Operations Toggle */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
              <RefreshCw className={`w-3.5 h-3.5 ${isWorkerClusterActive ? 'animate-spin text-emerald-400' : 'text-zinc-500'}`} style={{ animationDuration: '6s' }} />
              Cluster Engine state
            </span>
            <span className={`text-[11px] font-bold block ${isWorkerClusterActive ? 'text-emerald-400' : 'text-amber-500'}`}>
              {isWorkerClusterActive ? 'RUNNING MULTI-THREADED' : 'CLUSTER PIPELINE PAUSED'}
            </span>
          </div>
          <button
            onClick={() => setIsWorkerClusterActive(!isWorkerClusterActive)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isWorkerClusterActive 
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            title={isWorkerClusterActive ? 'Pause all global WASM threads' : 'Resume global compiling'}
          >
            {isWorkerClusterActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Metric 4: Diagnostic Worker Load */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-brand" />
            Active Processor Load
          </div>
          <div className="font-mono text-xl font-bold text-white flex items-baseline gap-1.5">
            <span>{currentProcessingCount}</span>
            <span className="text-zinc-600 text-xs font-normal">Active Threads</span>
            {currentPendingCount > 0 && (
              <span className="text-amber-500 text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                +{currentPendingCount} queued
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actual Worker Panel Lists */}
      {tasks.length === 0 ? (
        <div className="py-12 text-center rounded-xl bg-zinc-950/25 border border-dashed border-zinc-900/60 max-w-lg mx-auto space-y-3.5">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-500 border border-zinc-800/80">
            <Cpu className="w-5 h-5 text-brand/70" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-zinc-350">Worker Threads Standby</p>
            <p className="font-sans text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
              No live processes are queued. Initiate heavy compilations or tap the 'Simulate 4x Batch Job' dashboard utility below to visualize active performance streams.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {tasks.map((task) => {
              const isComp = task.status === 'completed';
              const isPaused = task.status === 'paused';
              const pPercent = Math.min(Math.max(task.progress, 0), 100);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-[#08080c] border border-zinc-900 rounded-xl gap-4 hover:border-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Status Spin Icon */}
                    <div className="flex-shrink-0">
                      {isComp ? (
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isPaused ? (
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 cursor-pointer transition-colors"
                          title="Click to resume"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand hover:bg-brand/20 cursor-pointer transition-colors"
                          title="Click to pause"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                        </button>
                      )}
                    </div>

                    {/* Meta Naming Column */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] bg-zinc-950 border border-zinc-900 text-[#94a3b8] px-2 py-0.5 rounded uppercase font-semibold">
                          {task.type}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">{task.timestamp}</span>
                      </div>
                      <p className="font-heading text-xs font-bold text-white truncate max-w-md" title={task.name}>
                        {task.name}
                      </p>
                    </div>
                  </div>

                  {/* Progressive visual bar column */}
                  <div className="w-full md:w-60 space-y-1 flex-shrink-0">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500">
                        {isComp ? 'Output Finalized' : isPaused ? 'Paused' : 'Locally packaging...'}
                      </span>
                      <span className={`font-bold ${isComp ? 'text-emerald-400' : 'text-brand'}`}>
                        {pPercent}%
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="h-2 bg-zinc-950 rounded-full border border-zinc-900 relative overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${pPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          isComp 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : isPaused 
                              ? 'bg-amber-500' 
                              : 'bg-gradient-to-r from-brand to-rose-500'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Original: {task.originalSize}</span>
                      {isComp && <span className="text-emerald-400">Compressed: {task.targetSize}</span>}
                    </div>
                  </div>

                  {/* Task Controls side block */}
                  <div className="flex items-center justify-end gap-2 pl-2">
                    <button
                      onClick={() => removeQueueTask(task.id)}
                      className="p-1 px-1.5 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-500 hover:text-red-400 cursor-pointer hover:border-red-950/40 transition-all active:scale-95 text-xs font-mono font-bold flex items-center gap-1.5"
                      title="Terminate background worker thread"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isComp ? 'Clear Logs' : 'Abort'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
