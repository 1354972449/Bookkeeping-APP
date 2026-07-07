import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { MonthlyStat, TrendItem, StatPeriod } from '../types';
import {
  getYearlyStats,
  getDailyStats,
  getMonthlyStats,
  getTrendByPeriod,
  getYearlyTotal,
  getMonthlyTotal,
  getDailyTotal,
} from '../utils/database';
import { Segmented } from 'antd';

echarts.use([
  PieChart,
  BarChart,
  LineChart,
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
  '#a18cd1', '#fbc2eb', '#84fab0', '#8fd3f4',
  '#f093fb', '#f5576c', '#ff9a9e',
];

const StatPage: React.FC<Props> = ({
  monthlyStats: initMonthlyStats,
  monthlyTotal: initMonthlyTotal,
  selectedMonth,
  onMonthChange,
  recordsCount = 0,
}) => {
  const [periodType, setPeriodType] = useState<StatPeriod>('month');
  const [yearValue, setYearValue] = useState<number>(dayjs().year());
  const [dayValue, setDayValue] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [categoryStats, setCategoryStats] = useState<MonthlyStat[]>(initMonthlyStats);
  const [totalAmount, setTotalAmount] = useState<number>(initMonthlyTotal);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStatsForPeriod = useCallback(async (type: StatPeriod) => {
    setStatsLoading(true);
    try {
      if (type === 'year') {
        const [stats, total, trend] = await Promise.all([
          getYearlyStats(yearValue),
          getYearlyTotal(yearValue),
          getTrendByPeriod('year', yearValue),
        ]);
        setCategoryStats(stats);
        setTotalAmount(total);
        setTrendData(trend);
      } else if (type === 'month') {
        const [y, m] = selectedMonth.split('-').map(Number);
        const [stats, total, trend] = await Promise.all([
          getMonthlyStats(y, m),
          getMonthlyTotal(y, m),
          getTrendByPeriod('month', selectedMonth),
        ]);
        setCategoryStats(stats);
        setTotalAmount(total);
        setTrendData(trend);
        if (y !== yearValue) setYearValue(y);
      } else {
        const [stats, total, trend] = await Promise.all([
          getDailyStats(dayValue),
          getDailyTotal(dayValue),
          getTrendByPeriod('day', dayValue),
        ]);
        setCategoryStats(stats);
        setTotalAmount(total);
        setTrendData(trend);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [yearValue, selectedMonth, dayValue]);

  useEffect(() => {
    loadStatsForPeriod(periodType);
  }, [periodType, yearValue, selectedMonth, dayValue]);

  useEffect(() => {
    if (periodType === 'month') {
      setCategoryStats(initMonthlyStats);
      setTotalAmount(initMonthlyTotal);
    }
  }, [initMonthlyStats, initMonthlyTotal, periodType]);

  const periodLabel = useMemo(() => {
    if (periodType === 'year') return `${yearValue}年`;
    if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      return `${y}年${m}月`;
    }
    return dayValue;
  }, [periodType, yearValue, selectedMonth, dayValue]);

  const periodSubtitle = useMemo(() => {
    if (periodType === 'year') return '年度消费全景，洞察全年支出结构';
    if (periodType === 'month') return '月度数据全面掌握，理财更从容';
    return '单日消费明细，检视每一笔支出';
  }, [periodType]);

  const avgLabel = useMemo(() => {
    if (periodType === 'year') {
      return { label: '月均消费', val: totalAmount > 0 ? totalAmount / 12 : 0, unit: '元/月' };
    }
    if (periodType === 'month') {
      const days = dayjs(selectedMonth).daysInMonth();
      return { label: '日均消费', val: totalAmount > 0 ? totalAmount / days : 0, unit: '元/日' };
    }
    return { label: '记录笔数', val: recordsCount, unit: '笔', isCount: true };
  }, [periodType, totalAmount, selectedMonth, recordsCount]);

  const isMaxPeriod = useMemo(() => {
    if (periodType === 'year') return yearValue >= dayjs().year();
    if (periodType === 'month') return selectedMonth >= dayjs().format('YYYY-MM');
    return dayValue >= dayjs().format('YYYY-MM-DD');
  }, [periodType, yearValue, selectedMonth, dayValue]);

  const handlePrev = () => {
    if (periodType === 'year') setYearValue(y => y - 1);
    else if (periodType === 'month') onMonthChange(dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM'));
    else setDayValue(d => dayjs(d).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const handleNext = () => {
    if (isMaxPeriod) return;
    if (periodType === 'year') setYearValue(y => y + 1);
    else if (periodType === 'month') onMonthChange(dayjs(selectedMonth).add(1, 'month').format('YYYY-MM'));
    else setDayValue(d => dayjs(d).add(1, 'day').format('YYYY-MM-DD'));
  };

  const maxAmount = Math.max(...categoryStats.map(s => s.total), 1);
  const topCategory = categoryStats[0];

  const pieData = categoryStats.map((s, i) => ({
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
      type: categoryStats.length > 8 ? 'scroll' : 'plain',
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
        labelLine: { length: 8, length2: 10, smooth: true },
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
      axisPointer: { type: 'shadow' as const, shadowStyle: { color: 'rgba(102, 126, 234, 0.08)' } },
    },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: categoryStats.map(s => s.category),
      axisLabel: {
        fontSize: 11,
        color: '#888',
        interval: 0,
        rotate: categoryStats.length > 5 ? 20 : 0,
      },
      axisLine: { lineStyle: { color: '#eee' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#888', formatter: '¥{value}' },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: categoryStats.map((s, i) => ({
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
        label: { show: true, position: 'top' as const, fontSize: 11, color: '#555', formatter: '¥{c}' },
      },
    ],
  };

  const trendOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'line' as const },
    },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: periodType === 'day' ? true : false,
      data: trendData.map(t => t.label),
      axisLabel: {
        fontSize: 11,
        color: '#888',
        interval: periodType === 'year' ? 0 : (trendData.length > 15 ? Math.floor(trendData.length / 8) : 0),
        rotate: trendData.length > 15 ? 30 : 0,
      },
      axisLine: { lineStyle: { color: '#eee' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#888', formatter: '¥{value}' },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: periodType === 'day' ? 'bar' : 'line',
        smooth: periodType !== 'day',
        data: trendData.map(t => t.total),
        symbol: periodType === 'day' ? 'none' : 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' },
          ]),
        },
        itemStyle: { color: '#667eea', borderColor: '#fff', borderWidth: 2 },
        areaStyle: periodType !== 'day' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102,126,234,0.35)' },
            { offset: 1, color: 'rgba(118,75,162,0.02)' },
          ]),
        } : undefined,
        barWidth: periodType === 'day' ? '45%' : undefined,
        label: {
          show: periodType === 'day',
          position: 'top' as const,
          fontSize: 11,
          color: '#555',
          formatter: '¥{c}',
        },
      },
    ],
  };

  const adviceText = useMemo(() => {
    if (periodType === 'year') {
      if (totalAmount > 60000) {
        return `⚠️ ${yearValue}年全年支出已超过 6 万元，建议复盘年度消费结构，规划下一年的预算目标。最高支出「${topCategory?.category || '餐饮'}」可作为重点优化方向。`;
      }
      if (totalAmount > 24000) {
        return `👍 ${yearValue}年全年支出控制在中等水平，消费习惯良好！最高支出「${topCategory?.category || '餐饮'}」可设置年度参考预算。`;
      }
      return `🎉 ${yearValue}年支出控制非常棒，消费非常理性！建议设置年度储蓄目标，让财富稳步增长。`;
    }
    if (periodType === 'month') {
      if (totalAmount > 5000) {
        return `⚠️ ${periodLabel}支出已超过 5000 元，建议适当控制消费。可重点关注「${topCategory?.category || '餐饮'}」类支出，尝试寻找更省钱的方案～`;
      }
      if (totalAmount > 2000) {
        return `👍 ${periodLabel}支出处于中等水平，继续保持良好的消费习惯！最高支出为「${topCategory?.category || '餐饮'}」，可以考虑设置月度预算哦。`;
      }
      return `🎉 ${periodLabel}支出控制得很棒，继续保持理性消费！建议设置储蓄目标，让理财更有计划性～`;
    }
    if (totalAmount > 500) {
      return `⚠️ ${periodLabel}单日支出超过 500 元，如果不是大额计划消费，建议多留意账单结构，及时调整～ 最大支出为「${topCategory?.category || '餐饮'}」。`;
    }
    if (totalAmount > 100) {
      return `👍 ${periodLabel}支出正常，记得坚持每天记账，养成理财好习惯哦！`;
    }
    return `🌱 ${periodLabel}支出控制得很好，或者还没有记账记录。记账一小步，理财一大步！`;
  }, [periodType, totalAmount, yearValue, periodLabel, topCategory]);

  const periodTrendTitle = useMemo(() => {
    if (periodType === 'year') return '📈 年度各月支出趋势';
    if (periodType === 'month') return '📈 月度每日支出趋势';
    return '📊 当日各分类支出对比';
  }, [periodType]);

  return (
    <div className="stat-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="header-title" style={{ marginBottom: 0 }}>📊 消费统计分析</div>
          <Segmented
            value={periodType}
            onChange={(v) => setPeriodType(v as StatPeriod)}
            options={[
              { label: '按年', value: 'year' },
              { label: '按月', value: 'month' },
              { label: '按天', value: 'day' },
            ]}
            size="middle"
          />
        </div>
        <div className="header-subtitle">{periodLabel} · {periodSubtitle}</div>
        <div className="header-stats">
          <div className="header-stat-card">
            <div className="stat-label">
              {periodType === 'year' ? '年总支出' : periodType === 'month' ? '月总支出' : '当日总支出'}
            </div>
            <div className="stat-value">
              {totalAmount.toFixed(0)}
              <span className="stat-unit">元</span>
            </div>
          </div>
          <div className="header-stat-card">
            <div className="stat-label">{avgLabel.label}</div>
            <div className="stat-value">
              {avgLabel.isCount ? avgLabel.val : avgLabel.val.toFixed(0)}
              <span className="stat-unit">{avgLabel.unit}</span>
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
          <button className="month-nav-btn" onClick={handlePrev}>‹</button>
          <div className="month-center">
            <div className="month-title">
              {periodType === 'year' ? `${yearValue}年` : periodLabel}
            </div>
            <div className="month-amount">¥{totalAmount.toFixed(2)}</div>
            <div className="month-label">
              {periodType === 'year' ? '年度总支出' : periodType === 'month' ? '本月总支出' : '当日总支出'}
              {statsLoading && <span style={{ marginLeft: 6, fontSize: 11, color: '#999' }}>加载中...</span>}
            </div>
          </div>
          <button className="month-nav-btn" onClick={handleNext} disabled={isMaxPeriod}>›</button>
        </div>

        {categoryStats.length === 0 ? (
          <div className="empty-state">
            <div className="big-icon">📊</div>
            <div className="empty-title">{periodLabel}暂无消费记录</div>
            <div className="empty-desc">快去记账吧，这里将为你展示详细的{periodType === 'year' ? '年度' : periodType === 'month' ? '月度' : '当日'}消费分析～</div>
          </div>
        ) : (
          <>
            <div className="ranking-list">
              <div className="ranking-header">
                <div className="stat-section-title" style={{ margin: 0 }}>🏆 {periodLabel}分类排行榜</div>
                <span className="ranking-count">共 {categoryStats.length} 个分类</span>
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
                      {periodLabel}最大支出
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
                    占总支出的 {totalAmount > 0 ? ((topCategory.total / totalAmount) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              )}
              {categoryStats.map((s, i) => (
                <div className="stat-bar-item" key={s.category}>
                  <span className="cat-icon">{s.icon || '📦'}</span>
                  <span className="cat-name" style={{ minWidth: 76 }}>{s.category}</span>
                  <div className="bar-bg">
                    <div
                      className="bar-fill"
                      style={{ width: `${(s.total / maxAmount) * 100}%` }}
                    />
                  </div>
                  <span className="amount-text">¥{s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pie-chart-wrap">
              <div className="stat-section-title">🥧 {periodLabel}支出分布饼图</div>
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
              <div className="stat-section-title">{periodTrendTitle}</div>
              <div style={{ height: 280 }}>
                <ReactEChartsCore
                  echarts={echarts}
                  option={trendOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                />
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="pie-chart-wrap">
              <div className="stat-section-title">📊 {periodLabel}分类对比柱状图</div>
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
                💡 {periodLabel}消费建议
              </div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {adviceText}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatPage;
