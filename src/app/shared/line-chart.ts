import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

export interface ChartSeries {
  label: string;
  data: { time: string; value: number }[];
  color: string;
  unit: string;
}

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasData()) {
      <div class="chart-wrapper">
        <div class="chart-legend">
          @for (s of series(); track s.label) {
            <span class="legend-item">
              <span class="legend-dot" [style.background]="s.color"></span>
              {{ s.label }} ({{ s.unit }})
            </span>
          }
        </div>
        <svg [attr.viewBox]="viewBox()" preserveAspectRatio="none" class="chart-svg">
          <!-- Grid lines -->
          @for (y of yTicks(); track y.value) {
            <line [attr.x1]="padding.left" [attr.y1]="y.py"
                  [attr.x2]="svgWidth() - padding.right" [attr.y2]="y.py"
                  stroke="currentColor" stroke-opacity="0.1" />
            <text [attr.x]="padding.left - 4" [attr.y]="y.py + 3"
                  text-anchor="end" fill="currentColor" fill-opacity="0.5" font-size="10">
              {{ y.label }}
            </text>
          }
          <!-- X labels -->
          @for (x of xTicks(); track x.label) {
            <text [attr.x]="x.px" [attr.y]="svgHeight() - 4"
                  text-anchor="middle" fill="currentColor" fill-opacity="0.5" font-size="10">
              {{ x.label }}
            </text>
          }
          <!-- Lines -->
          @for (s of chartPaths(); track s.label) {
            <polyline [attr.points]="s.points"
                      [attr.stroke]="s.color" stroke-width="2"
                      fill="none" stroke-linecap="round" stroke-linejoin="round" />
          }
        </svg>
      </div>
    } @else {
      <p class="no-data">No data available for this day.</p>
    }
  `,
  styles: `
    .chart-wrapper {
      width: 100%;
    }
    .chart-svg {
      width: 100%;
      height: 280px;
      display: block;
    }
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 8px 0;
      font-size: 13px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .no-data {
      text-align: center;
      opacity: 0.5;
      padding: 32px;
    }
  `,
})
export class LineChartComponent {
  readonly series = input<ChartSeries[]>([]);

  protected readonly padding = { top: 16, right: 16, bottom: 24, left: 40 };

  protected readonly hasData = computed(() =>
    this.series().some(s => s.data.length > 0));

  protected readonly svgWidth = () => 600;
  protected readonly svgHeight = () => 280;
  protected readonly viewBox = () => `0 0 ${this.svgWidth()} ${this.svgHeight()}`;

  private readonly allValues = computed(() => {
    const vals: number[] = [];
    for (const s of this.series()) {
      for (const d of s.data) vals.push(d.value);
    }
    return vals;
  });

  private readonly yRange = computed(() => {
    const vals = this.allValues();
    if (!vals.length) return { min: 0, max: 100 };
    const min = Math.floor(Math.min(...vals));
    const max = Math.ceil(Math.max(...vals));
    const padding = Math.max(1, (max - min) * 0.1);
    return { min: min - padding, max: max + padding };
  });

  private readonly timeRange = computed(() => {
    const allTimes: string[] = [];
    for (const s of this.series()) {
      for (const d of s.data) allTimes.push(d.time);
    }
    allTimes.sort();
    return { min: allTimes[0] ?? '', max: allTimes[allTimes.length - 1] ?? '' };
  });

  protected readonly yTicks = computed(() => {
    const { min, max } = this.yRange();
    const count = 5;
    const step = (max - min) / count;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const value = min + step * i;
      ticks.push({
        value,
        label: Math.round(value).toString(),
        py: this.yToPixel(value),
      });
    }
    return ticks;
  });

  protected readonly xTicks = computed(() => {
    const allTimes = new Set<string>();
    for (const s of this.series()) {
      for (const d of s.data) allTimes.add(d.time);
    }
    const sorted = [...allTimes].sort();
    if (sorted.length <= 1) return [];
    // Show up to 8 evenly spaced labels
    const step = Math.max(1, Math.floor(sorted.length / 8));
    const ticks = [];
    for (let i = 0; i < sorted.length; i += step) {
      const t = sorted[i];
      const date = new Date(t);
      ticks.push({
        label: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        px: this.xToPixel(t, sorted[0], sorted[sorted.length - 1]),
      });
    }
    return ticks;
  });

  protected readonly chartPaths = computed(() => {
    const { min: tMin, max: tMax } = this.timeRange();
    return this.series().map(s => ({
      label: s.label,
      color: s.color,
      points: s.data
        .map(d => `${this.xToPixel(d.time, tMin, tMax)},${this.yToPixel(d.value)}`)
        .join(' '),
    }));
  });

  private yToPixel(value: number): number {
    const { min, max } = this.yRange();
    const plotH = this.svgHeight() - this.padding.top - this.padding.bottom;
    return this.padding.top + plotH - ((value - min) / (max - min)) * plotH;
  }

  private xToPixel(time: string, tMin: string, tMax: string): number {
    const t = new Date(time).getTime();
    const min = new Date(tMin).getTime();
    const max = new Date(tMax).getTime();
    const range = max - min || 1;
    const plotW = this.svgWidth() - this.padding.left - this.padding.right;
    return this.padding.left + ((t - min) / range) * plotW;
  }
}
