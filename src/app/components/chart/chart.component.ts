import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType  } from 'chart.js'; 

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective as any],
  template: `
    <div class="chart-container" [style.height.px]="chartHeight">
      <div class="chart-wrapper">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="chartType"
          [plugins]="chartOptions?.inlinePlugins || []"> 
        </canvas>
      </div>
    </div>
  `    
})
export class ChartComponent {
  // 💡 型安全（ChartType）を完璧に維持した、最高に美しいプロパティ群
  @Input() chartHeight: number = 250;
  @Input() chartData: any;
  @Input() chartOptions: any;
  @Input() chartType: ChartType = 'bar';

}