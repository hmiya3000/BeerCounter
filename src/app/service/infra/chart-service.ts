import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartType, ChartData, Chart, registerables } from 'chart.js'; // 🌟 1. 必要な型をインポート
Chart.register(...registerables);

export interface IndicatorData {
  value:    number,
  bgColor:  string,
}
export interface CustomYLineSetting {
  yValue: number;
  labelText: string;
  color: string;
}
export type XAxisMode = 'linear' | 'category' | 'time';
@Injectable({
  providedIn: 'root',
})
export class ChartService {

  public verticalLineIndexMap: { [chartId: string]: number | undefined } = {};
  public chartTypeMap: { [chartId: string]: ChartType } = {};
  public chartDataMap: { [chartId: string]: ChartData<ChartType> } = {};
  public chartOptionsMap: { [chartId: string]: ChartConfiguration['options'] } = {};

  private defaultOptions: ChartConfiguration['options'] = {
    responsive: true,           
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom', 
        labels: { font: { size: 10 }, boxWidth: 12, boxHeight: 12 }
      }
    },
    scales: { y: { beginAtZero: true } }
  };
  constructor() {
    Chart.register({
      id: 'globalVerticalLinePlugin',
      beforeDraw: (chart: any) => {
        const chartId = chart.config.options?.plugins?.id || chart.id;
        const currentId = Object.keys(this.chartDataMap).find(id => chart.data.labels === this.chartDataMap[id]?.labels);
        if (!currentId) return;
        const targetIndex = this.verticalLineIndexMap[currentId];
        if (targetIndex === undefined || targetIndex < 0) return;
        const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
        const xPixel = x.getPixelForValue(targetIndex);
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff6666'; // 薄い赤
        ctx.setLineDash([4, 4]);        // 点線
        ctx.moveTo(xPixel, top);
        ctx.lineTo(xPixel, bottom);
        ctx.stroke();
        ctx.restore();
      }
    });
  }
  //===========================================================================
  public updateChartData(chartId: string, chartType: ChartType, _arrData: number[][], _arrLabel: string[],_labels: string[], targetYLines: number[] = [],targetXLines: number[] = [], showPoints: boolean = true){
    this.chartTypeMap[chartId]          = chartType;
    const colorPalette = [
      '#9090d0', // 1重目（薄い青紫）
      '#d09090', // 2重目（薄い赤・ピンク）
      '#90d090', // 3重目（薄い緑）
      '#d0d090', // 4重目（薄い黄色）
      '#d090d0', // 5重目（薄い紫）
    ];
    const dynamicDatasets = _arrData.map((dataRow, index) => {
      const isScatter = chartType === 'scatter' as any;
      let prevTotalMinutes = -1;
      let dayOffset = 0;
      const formattedData = isScatter 
        ? dataRow.map((val, idx) => {
          const timeStr = _labels[idx] || '00:00';
          const [hours, minutes] = timeStr.split(':').map(Number);
          let currentMinutes = (hours * 60) + (minutes || 0);
          if (prevTotalMinutes !== -1 && currentMinutes < prevTotalMinutes) {
            dayOffset += 1440; // 1日分（24時間 × 60分）を加算枠に追加
          }
          prevTotalMinutes = currentMinutes;
          return { x: currentMinutes + dayOffset, y: val };
        })
        : dataRow;
      const baseDataset: any = {
        label: _arrLabel[index] || `データ ${index + 1}`,
        data: formattedData,
        backgroundColor: colorPalette[index % colorPalette.length],
      };
      if (chartType === 'bar') {
        baseDataset.stack = 'stack-1';
        baseDataset.categoryPercentage = 0.5;
        baseDataset.barPercentage = 0.8;
      } else if (chartType === 'line') {
        baseDataset.borderColor = colorPalette[index % colorPalette.length];
        baseDataset.tension = 0.1;
        baseDataset.fill = false;
        baseDataset.pointRadius = showPoints ? 4 : 0;   // 点の表示・非表示切り替え
        baseDataset.pointHoverRadius = showPoints ? 6 : 0;
      } else if (isScatter) {
        baseDataset.borderColor = colorPalette[index % colorPalette.length];
        baseDataset.showLine = false;                       // 💡 線を表示せず、点だけにします
        baseDataset.pointRadius = showPoints ? 6 : 0;       // 💡 点を少し大きめにして視認性を高めます
        baseDataset.pointHoverRadius = showPoints ? 8 : 0;
      }
      return baseDataset;
    });
    this.chartDataMap[chartId] = {
      labels: _labels,
      datasets: dynamicDatasets
    };
    this.chartDataMap = { ...this.chartDataMap };
    this.chartTypeMap = { ...this.chartTypeMap };
  }
  //===========================================================================
  public updateChartOption(chartId: string, _xConf:{labels: string[], axisMode:XAxisMode}, _yConf:{min:number, max:number} ,  useAnimation: boolean = true, extraOptions?: { targetYLinesSetting?: CustomYLineSetting[], targetXLines?: number[] }){

    const theme = this.getChartTheme();
    const currentBaseOption = this.chartOptionsMap[chartId] || { ...this.defaultOptions };
    currentBaseOption.color = theme.textColor; 
    if (currentBaseOption.plugins?.legend?.labels) {
      currentBaseOption.plugins.legend.labels.color = theme.textColor;
    }


    const currentLabels = (_xConf.labels && _xConf.labels.length > 0 ? _xConf.labels : this.chartDataMap[chartId]?.labels || []) as string[];
    const existingScales: any   = currentBaseOption.scales || {};
    let xAxisConfig: any;
    if (_xConf.axisMode === 'category') {
      xAxisConfig = {
        ...existingScales['x'],
        type: 'category',
        ticks: {
          font: { size: 9 },
          color: theme.textColor, 
          autoSkip: true, // ラベルが被るのを防ぐために自動間引きを有効化
          callback: function(this: any,value: any) {
            return this.getLabelForValue(value);
          }            
        },
        grid: {
          color: theme.gridColor,
          borderDash: [4, 4]
        }        
      };      
    } else {
      // ⭕ 【数値モード ('linear') / 時刻モード ('time')】
      // 従来の等間隔 linear 軸を適用し、計算した min や stepSize を完璧に反映します
      const xParam                = this.calcXParams(currentLabels);
      const isTimeModeActive      = _xConf.axisMode === 'time';
      xAxisConfig = {
        ...existingScales['x'],
        type: 'linear',
        min: isTimeModeActive ? xParam.minTime : null,
        bounds: 'ticks',
        ticks: {
          font: { size: 9 },
          color: theme.textColor, 
          stepSize: xParam.step,
          autoSkip: false,
          callback: (value: any) => {
            return formatXAxisTick(null, value, isTimeModeActive);
          }            
        },
        grid: {
          color: theme.gridColor,
          borderDash: [4, 4]
        }
      };
    }
    //---
    const yParam                = this.calcYParams(_yConf.min, _yConf.max);
    this.chartOptionsMap[chartId] = {
      ...currentBaseOption,
      animation: useAnimation as any,
      scales: {
        ...existingScales, // 💡 これで既存の X 軸の設定を 100% 完璧に保護して引き継ぎます
        ['x']: xAxisConfig,
        ['y']: {
          ...existingScales['y'], // 💡 Y軸の既存設定（フォントや色など）があればそれも引き継ぎます
          min: yParam.rangeM,
          max: yParam.rangeP, 
          ticks: { 
            stepSize: yParam.step, 
            font: { size: 9 },
            color: theme.textColor, 
          },
          grid: {
            color: (context: any) => (context.tick?.value === 0 ? theme.zeroGridColor : theme.gridColor),
          }
        }
      },
      plugins: {
        ...currentBaseOption.plugins, // 既存のプラグイン設定があれば安全に引き継ぎます
        tooltip: {
          enabled: true,
          events: ['click', 'touchstart'], 
          mode: 'index',
          intersect: true,
          borderRadius: 8
        }
      } as any
    } as any;
    const targetOption = this.chartOptionsMap[chartId];
    if (targetOption) {
      (targetOption as any).targetYLinesSetting = extraOptions?.targetYLinesSetting || [];
      (targetOption as any).targetXLines        = extraOptions?.targetXLines || [];
      targetOption.plugins = targetOption.plugins || {};
      (targetOption as any).inlinePlugins = (targetOption as any).inlinePlugins || [];
      const activePlugins = [];
      activePlugins.push(this.createFullAreaLinePlugin(chartId));
      (targetOption as any).inlinePlugins = activePlugins;
      (targetOption as any).plugins = (targetOption as any).plugins || {};
      if (!Array.isArray(targetOption.plugins)) {
        (targetOption as any)._customPlugins = activePlugins; 
      }
    }
    this.chartOptionsMap = { ...this.chartOptionsMap };
  }
  //===========================================================================
  public updateIndicatorData(chartId: string, arrIndicator:IndicatorData[]){
    let datasets  = [];
    let valuePrev   = 0;
    for ( let ind of arrIndicator){
      datasets.push( {label:ind.value+'', data:[(ind.value-valuePrev)], backgroundColor:ind.bgColor, stack:'status', barThickness:35 })
      valuePrev = ind.value;
    }
    this.chartTypeMap[chartId] = 'bar'; // 横向き棒グラフも大元は 'bar' 型です
    this.chartDataMap[chartId] = {
      labels: ['dummy'], // 横1本にするためのダミーラベル
      datasets: datasets as any
    };
    // 💡 既存のマップオブジェクトをコピーして Angular に変更を通知します
    this.chartDataMap = { ...this.chartDataMap };
    this.chartTypeMap = { ...this.chartTypeMap };
  }
  public updateIndicatorOption(chartId: string, useAnimation: boolean = true){
    const currentBaseOption       = this.chartOptionsMap[chartId] || { ...this.defaultOptions };
    this.chartOptionsMap[chartId] = this._createIndicatorOptions(currentBaseOption, useAnimation);
    this.chartOptionsMap          = { ...this.chartOptionsMap };
  }
  private _createIndicatorOptions(baseOption: any, useAnimation: boolean): any {
    return {
      ...baseOption,
      indexAxis: 'y', // 📊 棒グラフを横向きにする設定
      animation: useAnimation as any,
      layout: { 
        padding: {  left: 0,  right: 0  }
      },
      plugins: {
        legend: { display: false },  // 凡例非表示
        tooltip: { enabled: false }  // ポップアップ非表示
      },
      scales: {
        ['x']: {
          min: 0,
          max: 0.50,
          offset: false, 
          grid: { display: false },  // 縦の格子線を消去
          border: { display: false },
          ticks: {
            display: false
          }
        },
        ['y']: {
          display: false, // 横型バーのダミーラベル行を非表示
          grid: { display: false }
        }
      }
    };
  }
  //===========================================================================
  private calcXParams(currentLabels:string[]):{ minTime:number, step:number }{
    let xMinParam: number     = 0;
    let stepSizeParam: number = 5;

    if (currentLabels && currentLabels.length > 0) {
      let prevTotalMinutes = -1;
      let dayOffset = 0;

      const minutesArray = currentLabels.map((timeStr) => {
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        let currentMinutes = (hours * 60) + (minutes || 0);
        
        // 日跨ぎの判定（updateChartDataと完全同期）
        if (prevTotalMinutes !== -1 && currentMinutes < prevTotalMinutes) {
          dayOffset += 1440;
        }
        prevTotalMinutes = currentMinutes;
        return currentMinutes + dayOffset;
      });
      const firstMinutes = minutesArray[0];
      const lastMinutes = minutesArray[minutesArray.length - 1];
      const durationMinutes = lastMinutes - firstMinutes;
      if (durationMinutes < 60) {
        // 1時間未満：5分刻み
        stepSizeParam = 5;
        xMinParam = Math.floor(firstMinutes / 5) * 5;
      } else if (durationMinutes < 360) {
        // 6時間未満：15分刻み
        stepSizeParam = 15;
        xMinParam = Math.floor(firstMinutes / 15) * 15;
      } else {
        // それ以上（24時間未満〜長期間）：1時間（60分）刻み
        // ※もし数日単位になる場合は、前述の通り120(2時間)や360(6時間)に広げるロジックに拡張可能です
        stepSizeParam = 60;
        xMinParam = Math.floor(firstMinutes / 60) * 60;
      }
    }
    return { minTime: xMinParam, step: stepSizeParam };
  }
  private calcYParams(_yMin:number, _yMax:number): { rangeM:number, rangeP:number, step:number}{
    let _yRangeM = _yMin >= 0 ? 0 : -this.truncateDigits(-_yMin);
    let _yRangeP = this.truncateDigits(_yMax);
    const totalRange = _yRangeP - _yRangeM;
    let _step = 0;

    if (totalRange > 0) {
      const rawStep = totalRange / 4; 
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      
      const normalizedRatio = rawStep / magnitude;
      if (normalizedRatio < 1.5) {
        _step = magnitude * 1;
      } else if (normalizedRatio < 3.5) {
        _step = magnitude * 2;
      } else {
        _step = magnitude * 5;
      }
      if (_yRangeM < 0) {
        _yRangeM = Math.floor(_yRangeM / _step) * _step; // ここで -5000 になります
        if (Math.abs(_yRangeM) < (_yRangeP / 5)) {
          _yRangeM = _yRangeM - _step; // 今回のケースでは安全に -10000 まで広がります
        }
      } else {
        _yRangeM = 0; 
      }

      if (_yRangeP > 0) {
        _yRangeP = Math.ceil(_yRangeP / _step) * _step; // ここで 30000 になります
      } else {
        _yRangeP = 0; 
      }
    }
    return { rangeM:_yRangeM, rangeP:_yRangeP, step:_step}
  }
  private createFullAreaLinePlugin(chartId: string) {
    return {
      id: 'fullAreaLinePlugin_' + chartId, // チャートごとにIDが重複しないように結合
      afterDatasetsDraw: (chart: any) => {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x, y } } = chart;
        
        const options: any = chart.options;
        const yLineSettings: CustomYLineSetting[] = options?.targetYLinesSetting || [];
        const xLines: number[] = options?.targetXLines || [];
        ctx.save();

        // 1. 水平線 (Y=??) の描画
        yLineSettings.forEach((setting) => {
          const pixelY = y.getPixelForValue(setting.yValue);
          if (pixelY >= top && pixelY <= bottom) {
            ctx.lineWidth = 2;            // 線の太さ
            ctx.strokeStyle = setting.color || '#ff6666';
            ctx.setLineDash([4, 4]);        // 点線にする設定（実線にしたい場合はこの行を削除）
            ctx.beginPath();
            ctx.moveTo(left, pixelY);
            ctx.lineTo(right, pixelY);
            ctx.stroke();
            //---
            ctx.restore(); // 一度点線の設定などをリセットするために保存状態を戻す
            ctx.save();

            ctx.fillStyle = setting.color || '#ff6666';
            ctx.font = 'bold 12px sans-serif';  // 💡 文字の太さと大きさ
            ctx.textAlign = 'left';            // 💡 文字を右寄せにする（左寄せが良い場合は 'left'）
            ctx.textBaseline = 'top';
            ctx.fillText(setting.labelText, left + 5, pixelY + 2); 
          }
        });

        // 2. 垂直線 (X=??) の描画
        xLines.forEach((xValue) => {
          const pixelX = x.getPixelForValue(xValue);
          if (pixelX >= left && pixelX <= right) {
            ctx.lineWidth = 2;              // 線の太さ（2px）
            ctx.strokeStyle = '#ff6666';  // 線の色（薄い赤）
            ctx.setLineDash([4, 4]);        // 点線にする設定（実線にしたい場合はこの行を削除）
            ctx.beginPath();
            ctx.moveTo(pixelX, top);        // チャート表示エリアの完全な上端
            ctx.lineTo(pixelX, bottom);     // チャート表示エリアの完全な下端
            ctx.stroke();
          }
        });
        ctx.restore();
      }
    };
  }
  private truncateDigits(num: number): number {
    if (!num || num <= 0) return 0;
    const p = Math.floor(Math.log10(num));
    return Math.ceil(num / Math.pow(10, p)) * Math.pow(10, p);
  }
  //===========================================================================
  private getChartTheme() {
    // OSがダークモードかどうかを判定
    const rootStyle = getComputedStyle(document.body);
    const fontColor   = rootStyle.getPropertyValue('--beetre-font-normal').trim();
    const borderColor = rootStyle.getPropertyValue('--beetre-border-light').trim();

    return {
      // 万が一読み込めなかった場合のフォールバック（バックアップの色）も指定しておくと安全です
      textColor: fontColor      || '#333333',     
      gridColor: borderColor    || '#E0E0E0',   
      zeroGridColor: fontColor  || '#C0C0C0', 
    };
  }  
  //===========================================================================
}
//=============================================================================
function formatXAxisTick(axisContext: any, value: any, isTimeActive: boolean): string {
  // 💡 1. axisContext を介さず、Chart.jsが計算して渡してきた目盛りの数値（＝通算分数）を直接評価します
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  // 時刻モードの場合の処理
  if (isTimeActive) {
    // 💡 2. numValue は「分」そのものなので、60で割って時間と分を算出します
    const totalMinutes = Math.round(numValue);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // 日を跨いで24時間を超えた場合（例: 25:00 など）も、24の余りにすることで「01:00」にサイクルさせます
    const displayHours   = (hours % 24).toString().padStart(2, '0');
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes}`;
  }

  // 通常の数値（数値モード）の場合はそのまま返却
  return numValue.toString();
}
//===========================================================================