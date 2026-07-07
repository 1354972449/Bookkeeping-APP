import React from 'react';
import dayjs from 'dayjs';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { MonthlyStat } from '../types';

echarts.use([
  PieChart,
  BarChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  CanvasRenderer,
]);

interface Props {
  monthlyStats: MonthlyStat[];
  monthlyTotal: number;
  selectedMonth: string;
  onMonthChange: (ym: string) => void;
  recordsCount?: number;
}

const COLORS = [
  '#667eea', '#f5576c', '#fda085', '#4facfe',
  '#43e97b', '#fa709a', '#30cfd0', '#fee140',
];

const StatPage: React.FC<Props> = ({
  monthlyStats,
  monthlyTotal,
  selectedMonth,
  onMonthChange,
  recordsCount = 0,
}) => {
  const maxAmount = Math.max(...monthlyStats.map(s => s.total), 1);
  const isCurrentMonth = selectedMonth === dayjs().format('YYYY-MM');
  const [year, month] = selectedMonth.split('-').map(Number);

  const dailyStats = React.useMemo(() => {
    const daysInMonth = dayjs(selectedMonth).daysInMonth();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: `${i}日`,
        value: 0,
      });
    }
    return days;
  }, [selectedMonth]);

  const pieData = monthlyStats.map((s, i) => ({
    name: s.category,
    value: Math.round(s.total * 100) / 100,
    itemStyle: { color: COLORS[i % COLORS.length] },
  }));

  const pieOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 13 },
      padding: [10, 14],
    },
    legend: {
      orient: 'horizontal' as const,
      bottom: 0,
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        data: pieData,
        label: {
          show: true,
          formatter: '{b}\n¥{c}',
          fontSize: 11,
          color: '#555',
          lineHeight: 16,
        },
        labelLine: {
          length: 8,
          length2: 10,
          smooth: true,
        },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          scale: true,
          scaleSize: 6,
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    ],
  };

  const barOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: {
        type: 'shadow' as const,
        shadowStyle: { color: 'rgba(102, 126, 234, 0.08)' },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: monthlyStats.map(s => s.category),
      axisLabel: {
        fontSize: 11,
        color: '#888',
        interval: 0,
        rotate: monthlyStats.length > 5 ? 20 : 0,
      },
      axisLine: { lineStyle: { color: '#eee' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        fontSize: 11,
        color: '#888',
        formatter: '¥{value}',
      },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: monthlyStats.map((s, i) => ({
          value: Math.round(s.total * 100) / 100,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS[i % COLORS.length] },
              { offset: 1, color: COLORS[i % COLORS.length] + '80' },
            ]),
            borderRadius: [8, 8, 0, 0],
          },
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top' as const,
          fontSize: 11,
          color: '#555',
          formatter: '¥{c}',
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

  const avgPerDay = monthlyTotal / dayjs(selectedMonth).daysInMonth();
  const topCategory = monthlyStats[0];

  return (
    <div className="stat-container">
      <div className="page-header">
        <div className="header-title">📊 消费统计分析</div>
        <div className="header-subtitle">
          {year}年{month}月 · 数据全面掌握，理财更从容
        </div>
        <div className="header-stats">
          <div className="header-stat-card">
            <div className="stat-label">月总支出</div>
            <div className="stat-value">
              {monthlyTotal.toFixed(0)}
              <span className="stat-unit">元</span>
            </div>
          </div>
          <div className="header-stat-card">
            <div className="stat-label">日均消费</div>
            <div className="stat-value">
              {avgPerDay.toFixed(0)}
              <span className="stat-unit">元</span>
            </div>
          </div>
          <div className="header-stat-card">
            <div className="stat-label">记账笔数</div>
            <div className="stat-value">
              {recordsCount}
              <span className="stat-unit">笔</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="month-navigator">
          <button
            className="month-nav-btn"
            onClick={handlePrevMonth}
          >
            ‹
          </button>
          <div className="month-center">
            <div className="month-title">{year}年{month}月</div>
            <div className="month-amount">¥{monthlyTotal.toFixed(2)}</div>
            <div className="month-label">本月总支出</div>
          </div>
          <button
            className="month-nav-btn"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
          >
            ›
          </button>
        </div>

        {monthlyStats.length === 0 ? (
          <div className="empty-state">
            <div className="big-icon">📊</div>
            <div className="empty-title">该月暂无消费记录</div>
            <div className="empty-desc">
              快去记账吧，这里将为你展示详细的消费分析～
            </div>
          </div>
        ) : (
          <>
            <div className="ranking-list">
              <div className="ranking-header">
                <div className="stat-section-title" style={{ margin: 0 }}>
                  🏆 分类排行榜
                </div>
                <span className="ranking-count">
                  共 {monthlyStats.length} 个分类
                </span>
              </div>
              {topCategory && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)',
                    marginBottom: 12,
                    border: '1px solid rgba(250, 173, 20, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>🥇</span>
                    <span style={{ fontSize: 12, color: '#d48806', fontWeight: 500 }}>
                      本月最大支出
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{topCategory.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f' }}>
                        {topCategory.category}
                      </span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>
                      ¥{topCategory.total.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 6, paddingLeft: 34 }}>
                    占总支出的 {monthlyTotal > 0 ? ((topCategory.total / monthlyTotal) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              )}
              {monthlyStats.map((s, i) => (
                <div className="stat-bar-item" key={s.category}>
                  <span className="cat-icon">{s.icon || '📦'}</span>
                  <span className="cat-name">{s.category}</span>
                  <div className="bar-bg">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(s.total / maxAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="amount-text">¥{s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pie-chart-wrap">
              <div className="stat-section-title">🥧 支出分布饼图</div>
              <div style={{ height: 320 }}>
                <ReactEChartsCore
                  echarts={echarts}
                  option={pieOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                />
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="pie-chart-wrap">
              <div className="stat-section-title">📊 分类对比柱状图</div>
              <div style={{ height: 280 }}>
                <ReactEChartsCore
                  echarts={echarts}
                  option={barOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                border: '1px solid rgba(22, 119, 255, 0.15)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1677ff', marginBottom: 8 }}>
                💡 本月消费建议
              </div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
                {monthlyTotal > 5000 ? (
                  <>
                    ⚠️ 本月支出已超过 5000 元，建议适当控制消费。
                    <br />
                    可重点关注「{topCategory?.category || '餐饮'}」类支出，尝试寻找更省钱的方案～
                  </>
                ) : monthlyTotal > 2000 ? (
                  <>
                    👍 本月支出处于中等水平，继续保持良好的消费习惯！
                    <br />
                    最高支出为「{topCategory?.category || '餐饮'}」，可以考虑设置月度预算哦。
                  </>
                ) : (
                  <>
                    🎉 本月支出控制得很棒，继续保持理性消费！
                    <br />
                    建议设置储蓄目标，让理财更有计划性～
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatPage;
