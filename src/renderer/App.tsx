import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { message, Popconfirm } from 'antd';
import { PlusOutlined, UnorderedListOutlined, PieChartOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllCategories, addRecord, getRecords, getMonthlyStats, getMonthlyTotal, deleteRecord } from './utils/database';
import type { Category, RecordItem, MonthlyStat } from './types';
import StatPage from './pages/StatPage';
import AddRecordModal from './components/AddRecordModal';

type TabType = 'records' | 'add' | 'stats';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = dayjs().format('YYYY-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const todayStr = dayjs().format('YYYY-MM-DD');

  const loadCategories = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  }, []);

  const loadRecords = useCallback(async () => {
    const data = await getRecords(200, 0);
    setRecords(data);
  }, []);

  const loadStats = useCallback(async (ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    const [stats, total] = await Promise.all([
      getMonthlyStats(year, month),
      getMonthlyTotal(year, month),
    ]);
    setMonthlyStats(stats);
    setMonthlyTotal(total);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadCategories();
        await loadRecords();
        await loadStats(currentMonth);
      } catch (err) {
        console.error('加载数据失败:', err);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddRecord = async (amount: number, categoryId: number, note: string) => {
    try {
      const id = uuidv4();
      const today = todayStr;
      await addRecord(id, amount, categoryId, note, today);
      message.success('🎉 记账成功！');
      setShowAddModal(false);
      setActiveTab('records');
      await loadRecords();
      await loadStats(selectedMonth);
    } catch (err) {
      console.error('添加记录失败:', err);
      message.error('记录失败，请重试');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      message.success('已删除记录');
      await loadRecords();
      await loadStats(selectedMonth);
    } catch (err) {
      console.error('删除失败:', err);
      message.error('删除失败，请重试');
    }
  };

  const handleMonthChange = async (ym: string) => {
    setSelectedMonth(ym);
    await loadStats(ym);
  };

  const todayRecords = useMemo(() => {
    return records.filter(r => r.recordDate === todayStr);
  }, [records, todayStr]);

  const todayTotal = useMemo(() => {
    return todayRecords.reduce((s, r) => s + r.amount, 0);
  }, [todayRecords]);

  const currentMonthRecords = useMemo(() => {
    return records.filter(r => r.recordDate.startsWith(selectedMonth));
  }, [records, selectedMonth]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const greeting = useMemo(() => {
    const h = dayjs().hour();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    if (h < 22) return '晚上好';
    return '夜深了';
  }, []);

  const groupedRecords: Record<string, RecordItem[]> = useMemo(() => {
    const g: Record<string, RecordItem[]> = {};
    records.forEach((r) => {
      if (!g[r.recordDate]) {
        g[r.recordDate] = [];
      }
      g[r.recordDate].push(r);
    });
    return g;
  }, [records]);

  if (loading) {
    return (
      <div className="app-container">
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 16,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <div>黑马记账加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-area">
        {activeTab === 'records' && (
          <div>
            <div className="page-header">
              <div className="header-title">
                👋 {greeting}，欢迎使用黑马记账
              </div>
              <div className="header-subtitle">
                今天是 {dayjs().format('M月D日')} 星期{weekDays[dayjs().day()]}
              </div>
              <div className="header-stats">
                <div className="header-stat-card">
                  <div className="stat-label">今日支出</div>
                  <div className="stat-value">
                    {todayTotal.toFixed(0)}
                    <span className="stat-unit">元</span>
                  </div>
                </div>
                <div className="header-stat-card">
                  <div className="stat-label">本月支出</div>
                  <div className="stat-value">
                    {monthlyTotal.toFixed(0)}
                    <span className="stat-unit">元</span>
                  </div>
                </div>
                <div className="header-stat-card">
                  <div className="stat-label">记账笔数</div>
                  <div className="stat-value">
                    {currentMonthRecords.length}
                    <span className="stat-unit">笔</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-content">
              {todayRecords.length > 0 && (
                <div className="section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f' }}>
                      📍 今日账单
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {todayRecords.length} 笔
                    </div>
                  </div>
                  {todayRecords.map((item) => (
                    <div className="record-card" key={item.id}>
                      <div className="left">
                        <div className="icon-circle">{item.icon || '📦'}</div>
                        <div className="info">
                          <div className="main">{item.subCategory}</div>
                          <div className="sub">
                            {item.mainCategory}
                            {item.note ? ` · ${item.note}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="amount">
                        -¥{item.amount.toFixed(2)}
                        <Popconfirm
                          title="确认删除这条记录？"
                          okText="删除"
                          cancelText="取消"
                          okType="danger"
                          onConfirm={() => handleDeleteRecord(item.id)}
                        >
                          <span className="delete-btn">
                            <DeleteOutlined style={{ fontSize: 11 }} />
                          </span>
                        </Popconfirm>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {records.length === 0 ? (
                <div className="empty-state">
                  <div className="big-icon">📝</div>
                  <div className="empty-title">还没有记账记录</div>
                  <div className="empty-desc">
                    点击中间的 ＋ 按钮开始记录你的第一笔支出吧～<br />
                    养成记账好习惯，理财更轻松！
                  </div>
                  <button
                    className="empty-action-btn"
                    onClick={() => setShowAddModal(true)}
                  >
                    💰 立即记账
                  </button>
                </div>
              ) : (
                <div>
                  <div className="records-toolbar">
                    <span className="toolbar-title">📋 全部账单</span>
                    <span className="toolbar-count">
                      共 {records.length} 条记录
                    </span>
                  </div>
                  {Object.entries(groupedRecords).map(([date, items]) => (
                    <div className="date-group" key={date}>
                      <div className="date-header">
                        <div className="date-left">
                          <span className="date-dot" />
                          <span>
                            {dayjs(date).format('M月D日')} 星期{weekDays[dayjs(date).day()]}
                          </span>
                        </div>
                        <span className="date-sum">
                          合计 ¥{items.reduce((s, i) => s + i.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      {items.map((item) => (
                        <div className="record-card" key={item.id}>
                          <div className="left">
                            <div className="icon-circle">{item.icon || '📦'}</div>
                            <div className="info">
                              <div className="main">{item.subCategory}</div>
                              <div className="sub">
                                {item.mainCategory}
                                {item.note ? ` · ${item.note}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="amount">
                            -¥{item.amount.toFixed(2)}
                            <Popconfirm
                              title="确认删除这条记录？"
                              okText="删除"
                              cancelText="取消"
                              okType="danger"
                              onConfirm={() => handleDeleteRecord(item.id)}
                            >
                              <span className="delete-btn">
                                <DeleteOutlined style={{ fontSize: 11 }} />
                              </span>
                            </Popconfirm>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <StatPage
            monthlyStats={monthlyStats}
            monthlyTotal={monthlyTotal}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            recordsCount={currentMonthRecords.length}
          />
        )}

        {activeTab === 'add' && null}
      </div>

      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <UnorderedListOutlined className="nav-icon" />
          <span>账单</span>
        </button>
        <button
          className="nav-item add-btn"
          onClick={() => setShowAddModal(true)}
        >
          <div className="nav-icon-wrap">
            <PlusOutlined className="nav-icon" />
          </div>
          <span>记账</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <PieChartOutlined className="nav-icon" />
          <span>统计</span>
        </button>
      </div>

      {showAddModal && (
        <AddRecordModal
          categories={categories}
          onSave={handleAddRecord}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default App;
