import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartData } from '../../utils/chart-extractor';

@Component({
  selector: 'app-chat-chart',
  standalone: true,
  template: `<div #chartContainer class="chart-wrapper"></div>`,
  styles: `
    :host {
      display: block;
      margin-top: 8px;
    }
    .chart-wrapper {
      position: relative;
      width: 100%;
      max-height: 260px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px;
    }
  `,
})
export class ChatChartComponent implements AfterViewInit, OnDestroy {
  readonly chartData = input.required<ChartData>();

  @ViewChild('chartContainer', { static: true })
  private readonly container!: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private chart: any = null;

  ngAfterViewInit() {
    if (this.isBrowser) {
      setTimeout(() => this.renderChart());
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.chart = null;
  }

  private async renderChart() {
    const data = this.chartData();
    if (!data?.labels?.length || !data.datasets?.length) return;

    try {
      const chartJs = await import('chart.js');
      const {
        Chart,
        LineController,
        BarController,
        PieController,
        DoughnutController,
        LineElement,
        BarElement,
        PointElement,
        ArcElement,
        CategoryScale,
        LinearScale,
        Tooltip,
        Legend,
        Filler,
      } = chartJs;

      Chart.register(
        LineController,
        BarController,
        PieController,
        DoughnutController,
        LineElement,
        BarElement,
        PointElement,
        ArcElement,
        CategoryScale,
        LinearScale,
        Tooltip,
        Legend,
        Filler,
      );

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.maxHeight = '240px';
      this.container.nativeElement.appendChild(canvas);

      const colors = [
        'rgba(225, 18, 37, 0.7)',
        'rgba(16, 69, 132, 0.7)',
        'rgba(62, 155, 97, 0.7)',
        'rgba(242, 186, 42, 0.7)',
        'rgba(240, 127, 68, 0.7)',
      ];
      const borderColors = ['#E11225', '#104584', '#3E9B61', '#F2BA2A', '#F07F44'];

      const datasets = data.datasets.map((ds, i) => ({
        ...ds,
        borderColor: ds.borderColor ?? borderColors[i % borderColors.length],
        backgroundColor:
          data.type === 'line'
            ? (ds.backgroundColor ?? `${borderColors[i % borderColors.length]}15`)
            : (ds.backgroundColor ?? `${colors[i % colors.length]}`),
        borderWidth: data.type === 'line' ? 2.5 : 1.5,
        pointRadius: data.type === 'line' ? 4 : undefined,
        pointBackgroundColor: data.type === 'line' ? '#fff' : undefined,
        pointBorderColor: data.type === 'line' ? borderColors[i % borderColors.length] : undefined,
        pointBorderWidth: data.type === 'line' ? 2 : undefined,
        tension: ds.tension ?? (data.type === 'line' ? 0.3 : 0),
        fill: ds.fill ?? false,
      }));

      this.chart = new Chart(canvas, {
        type: data.type as any,
        data: { labels: data.labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: data.datasets.length > 1,
              labels: { font: { size: 11, family: 'Manrope' }, usePointStyle: true, padding: 12 },
            },
            tooltip: {
              backgroundColor: '#15263b',
              titleFont: { size: 12, family: 'Manrope' },
              bodyFont: { size: 11, family: 'Manrope' },
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales:
            data.type === 'pie' || data.type === 'doughnut'
              ? {}
              : {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, family: 'Manrope' }, color: '#768699' },
                  },
                  y: {
                    grid: { color: '#e9eef4' },
                    ticks: { font: { size: 10, family: 'Manrope' }, color: '#768699' },
                    beginAtZero: false,
                  },
                },
        },
      });
    } catch (err) {
      console.warn('[ChatChart] render error:', err);
    }
  }
}
