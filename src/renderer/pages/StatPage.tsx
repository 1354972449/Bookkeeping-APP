import React from 'react';
import dayjs from 'dayjs';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { MonthlyStat } from '../types';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface Props {
  monthlyStats: MonthlyStat[];
  monthlyTotal: number;
  selectedMonth: string;
  onMonthChange: (ym: string) => void;
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

const StatPage: React.FC<Props> = ({ monthlyStats, monthlyTotal, selectedMonth, onMonthChange }) => {
  const maxAmount = Math.max(...monthlyStats.map(s => s.total), 1);

  const pieData = monthlyStats.map((s, i) => ({
    name: s.category,
    value: Math.round(s.total * 100) / 100,
    itemStyle: { color: COLORS[i % COLORS.length] },
  }));

  const pieOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: ¥{c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '55%'],
        data: pieData,
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 12,
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
      },
    ],
  };

  const handlePrevMonth = () => {
    const m = dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM');
    onMonthChange(m);
  };

  const handleNextMonth = () => {
    const m = dayjs(selectedMonth).add(1, 'month').format('YYYY-MM');
    if (m > dayjs().format('YYYY-MM')) return;
    onMonthChange(m);
  };

  return (
    <div className="stat-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span onClick={handlePrevMonth} style={{ cursor: 'pointer', fontSize: 18, color: '#1677ff' }}>‹</span>
        <div style={{ textAlign: 'center' }}>
          <div className="stat-section-title" style={{ margin: 0 }}>{selectedMonth}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#333' }}>
            ¥{monthlyTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: 13, color: '#999' }}>本月总支出</div>
        </div>
        <span
          onClick={handleNextMonth}
          style={{
            cursor: dayjs(selectedMonth) < dayjs().startOf('month') ? 'pointer' : 'not-allowed',
            fontSize: 18,
            color: dayjs(selectedMonth) < dayjs().startOf('month') ? '#1677ff' : '#d9d9d9',
          }}
        >
          ›
        </span>
      </div>

      {monthlyStats.length === 0 ? (
        <div className="empty-state">
          <div className="big-icon">📊</div>
          <p>该月暂无记录</p>
        </div>
      ) : (
        <>
          <div className="stat-section-title">分类排行</div>
          <div style={{ marginBottom: 24 }}>
            {monthlyStats.map((s, i) => (
              <div className="stat-bar-item" key={s.category}>
                <span className="cat-icon">{s.icon || '📦'}</span>
                <span className="cat-name">{s.category}</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(s.total / maxAmount) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="amount-text">¥{s.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="stat-section-title">支出分布</div>
          <div style={{ height: 280 }}>
            <ReactEChartsCore
              echarts={echarts}
              option={pieOption}
              style={{ height: '100%' }}
              notMerge
            />
          </div>
        </>
      )}
    </div>
  );
};

export default StatPage;
