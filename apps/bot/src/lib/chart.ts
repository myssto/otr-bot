import type { PlayerStats, RatingAdjustment } from '@otr';
import type { ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'node:fs';
import path from 'node:path';

interface RatingChartDataPoint {
  rating: number;
  timestamp: number;
}

const CHART_CONSTANTS = {
  MIN_DATA_POINTS: 2,
  Y_AXIS_TARGET_TICKS: 5,
  X_AXIS_TARGET_TICKS: 6,
  Y_PADDING_MAGNITUDE: 5,
};

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

const chartDir = path.resolve(path.join(__dirname, '..', 'charts'));
if (!fs.existsSync(chartDir)) {
  fs.mkdirSync(chartDir);
}

export const chartCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });

const createTickInterval = (estimateInterval: number): number => {
  const magnitude = Math.pow(5, Math.floor(Math.log10(estimateInterval)));
  const normalizedInterval = estimateInterval / magnitude;

  const interval = ((): number => {
    switch (true) {
      case normalizedInterval <= 1:
        return magnitude;
      case normalizedInterval <= 2:
        return magnitude * 2;
      case normalizedInterval <= 2.5:
        return magnitude * 2.5;
      case normalizedInterval <= 5:
        return magnitude * 5;
      default:
        return magnitude * 10;
    }
  })();

  return interval < 1 ? 1 : Math.round(interval);
};

const createYAxisBounds = (
  adjustments: RatingAdjustment[]
): {
  min: number;
  max: number;
  ticks: number[];
  stepSize: number;
} => {
  const metricValues = adjustments.map((ra) => ra.ratingAfter);
  const minValue = Math.min(...metricValues);
  const maxValue = Math.max(...metricValues);
  const valueRange = maxValue - minValue;

  const targetTickCount = CHART_CONSTANTS.Y_AXIS_TARGET_TICKS;
  const estimateInterval = valueRange / (targetTickCount - 1);

  const interval = createTickInterval(estimateInterval);
  const minBound = Math.floor(minValue / interval) * interval;
  const maxBound = Math.ceil(maxValue / interval) * interval;

  const tickValues: number[] = [];
  for (let t = minBound; t <= maxBound; t += interval) {
    tickValues.push(t);
  }

  return {
    min: minBound,
    max: maxBound,
    ticks: tickValues,
    stepSize: interval,
  };
};

const createXAxisTicks = (minTime: number, maxTime: number): number[] => {
  const targetTickCount = CHART_CONSTANTS.X_AXIS_TARGET_TICKS;
  const timeRange = maxTime - minTime;

  const tickMarks = [];
  for (let i = 0; i < targetTickCount; i++) {
    const tickTime = minTime + (timeRange * i) / (targetTickCount - 1);
    tickMarks.push(Math.round(tickTime));
  }

  return tickMarks;
};

/**
 * Creates and saves an image of a rating graph for a player.
 * @param player Player data.
 * @returns The path to the graph image.
 */
export const createRatingGraph = async (player: PlayerStats): Promise<string> => {
  const chartPath = path.join(chartDir, `${player.playerInfo.id}.png`);
  // Reuse existing chart if less than a week old
  if (fs.existsSync(chartPath)) {
    const stat = fs.statSync(chartPath);
    if (new Date().getTime() - stat.mtimeMs < WEEK_IN_MS) {
      console.log('using cached chart');
      return chartPath;
    }
  }

  const sortedData = player.rating.adjustments.toSorted((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const dataPoints: RatingChartDataPoint[] = sortedData.map((ra) => ({
    rating: ra.ratingAfter,
    timestamp: ra.timestamp.getTime(),
  }));

  const timestamps = dataPoints.map((d) => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  const xAxisTicks = createXAxisTicks(minTime, maxTime);
  const yAxisConfig = createYAxisBounds(sortedData);

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Rating',
          data: dataPoints.map((d) => ({
            x: d.timestamp,
            y: d.rating,
          })),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.5,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: minTime,
          max: maxTime,
          ticks: {
            callback: (value) => {
              return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            },
            autoSkip: false,
            maxRotation: 0,
            font: {
              size: 14,
            },
          },
          afterBuildTicks: (axis) => {
            axis.ticks = xAxisTicks.map((value) => ({ value }));
          },
        },
        y: {
          min: yAxisConfig.min,
          max: yAxisConfig.max,
          ticks: {
            stepSize: yAxisConfig.stepSize,
            callback: (value) => Math.round(value as number).toString(),
            font: {
              size: 14,
            },
          },
          afterBuildTicks: (axis) => {
            axis.ticks = yAxisConfig.ticks.map((value) => ({ value }));
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Rating Over Time',
          align: 'start',
          font: {
            size: 18,
          },
          padding: {
            bottom: 20,
          },
        },
      },
    },
  };

  const buffer = await chartCanvas.renderToBuffer(configuration);
  fs.writeFileSync(chartPath, buffer);
  return chartPath;
};
