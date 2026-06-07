import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getToolUsageData } from '../utils/toolAnalytics';
import { Activity, Clock, ShieldCheck } from 'lucide-react';

interface ChartItem {
  toolId: string;
  toolLabel: string;
  count: number;
}

export default function D3AnalyticsChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartItem[]>(() => 
    getToolUsageData().filter(d => d.count > 0).slice(0, 6)
  );
  const [activeTooltip, setActiveTooltip] = useState<{ label: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getToolUsageData().filter(d => d.count > 0).slice(0, 6);
      setData(updated);
    };

    window.addEventListener('apex_tool_analytics_updated', handleUpdate);
    window.addEventListener('apex_recent_ops_updated', handleUpdate);
    return () => {
      window.removeEventListener('apex_tool_analytics_updated', handleUpdate);
      window.removeEventListener('apex_recent_ops_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      const { width, height } = entries[0].contentRect;
      drawChart(width, height || 240);
    });

    observer.observe(container);
    
    // Initial draw
    const rect = container.getBoundingClientRect();
    drawChart(rect.width, 240);

    return () => {
      observer.disconnect();
    };
  }, [data]);

  const drawChart = (containerWidth: number, containerHeight: number) => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 15, right: 30, bottom: 35, left: 140 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    svg
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add glowing drop shadow filter for active indicators
    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'glow-bar')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', (d: any) => d);

    // Linear orange/crimson bar gradients
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ae1d25').attr('stop-opacity', 0.85);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48').attr('stop-opacity', 1.0);

    // Scales
    const y = d3
      .scaleBand()
      .rangeRound([0, height])
      .padding(0.3)
      .domain(data.map(d => d.toolLabel));

    const countsArray = data.map(d => d.count);
    const maxCount = Math.max(...countsArray, 1);
    const x = d3
      .scaleLinear()
      .rangeRound([0, width])
      .domain([0, maxCount]);

    // X Axis Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#1d1d26')
      .style('stroke-opacity', 0.6)
      .style('stroke-dasharray', '3,3');

    // Bottom Axis (Ticks)
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickFormat(d3.format('d'))
      )
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-family', 'JetBrains Mono, ui-monospace')
      .style('font-size', '10px');

    g.selectAll('.domain')
      .style('stroke', '#27272a');
    g.selectAll('line')
      .style('stroke', '#27272a');

    // Left Axis Labels
    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .style('fill', '#cbd5e1')
      .style('font-family', 'Inter, system-ui')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .attr('dx', '-8px');

    g.selectAll<SVGPathElement, unknown>('.domain').remove(); // hide axis border line

    // Render Bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar-group');

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d: any) => y(d.toolLabel) || 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', 'url(#bar-gradient)')
      .style('cursor', 'pointer')
      .on('mouseover', function (event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(150)
          .style('opacity', 0.9)
          .attr('filter', 'url(#glow-bar)');

        const [mX, mY] = d3.pointer(event, svgRef.current);
        setActiveTooltip({
          label: d.toolLabel,
          count: d.count,
          x: mX + 20,
          y: mY - 35
        });
      })
      .on('mousemove', function (event: any) {
        const [mX, mY] = d3.pointer(event, svgRef.current);
        setActiveTooltip(prev => prev ? { ...prev, x: mX + 20, y: mY - 35 } : null);
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .style('opacity', 1.0)
          .attr('filter', null);

        setActiveTooltip(null);
      })
      // Interactive entry animation
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((_d: any, i: number) => i * 100)
      .attr('width', (d: any) => x(d.count));

    // Inner text value labels inside bars (only if bar offers enough width)
    barGroups
      .append('text')
      .attr('y', (d: any) => (y(d.toolLabel) || 0) + y.bandwidth() / 2 + 4)
      .attr('x', (d: any) => Math.max(12, x(d.count) - 18))
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-family', 'JetBrains Mono, ui-monospace')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('pointer-events', 'none')
      .text((d: any) => d.count)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((_d: any, i: number) => i * 100 + 700)
      .style('opacity', (d: any) => x(d.count) > 25 ? 1 : 0);
  };

  return (
    <div className="bg-[#07070a]/90 rounded-2xl border border-zinc-900 overflow-hidden relative group/chart">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl bg-brand/5 pointer-events-none group-hover/chart:bg-brand/10 transition-colors duration-500" />
      
      <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/20">
        <div className="flex items-center gap-2.5 bg-transparent">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.15)]">
            <Activity className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-bold text-zinc-300 uppercase tracking-widest leading-none">Active Workspace Telemetry</h3>
            <p className="font-mono text-[9px] text-zinc-500 mt-1 leading-none">D3 Dynamic aggregate of operations / view switches in past 7 days</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0e0e15] border border-zinc-850">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[9px] text-zinc-400">Live Feedback</span>
        </div>
      </div>

      <div className="p-6 relative bg-transparent">
        {data.length === 0 ? (
          <div className="h-[240px] flex flex-col items-center justify-center text-center select-none border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20">
            <Clock className="w-10 h-10 text-zinc-800 mb-2 stroke-1" />
            <span className="font-mono text-[9px] text-zinc-650 uppercase font-bold">Workspace Telemetry Silent</span>
            <p className="text-[10px] text-zinc-500 max-w-[260px] leading-relaxed pt-1 select-none">
              Navigate between local utilities or execute file optimization pipelines to stream realtime visual feedback metrics.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-[240px] relative">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
            
            {/* Elegant tooltips */}
            {activeTooltip && (
              <div
                className="absolute pointer-events-none bg-zinc-950/95 border border-rose-500/30 text-white rounded-lg p-2.5 shadow-xl font-mono text-[10px] space-y-1 block backdrop-blur-md z-40 transition-all duration-75"
                style={{
                  left: `${activeTooltip.x}px`,
                  top: `${activeTooltip.y}px`,
                }}
              >
                <div className="font-bold text-zinc-300 border-b border-zinc-900 pb-1 mb-1">{activeTooltip.label}</div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-zinc-500">Telemetry count:</span>
                  <span className="text-rose-400 font-bold">{activeTooltip.count} operations</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-zinc-950/50 p-3 border-t border-zinc-900 text-[10px] font-mono text-zinc-550 flex justify-between items-center sm:px-6 select-none">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Client sandbox telemetry only</span>
        </div>
        <span>Data auto-purged on backup formats</span>
      </div>
    </div>
  );
}
