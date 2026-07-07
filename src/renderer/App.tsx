import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { message } from 'antd';
import { PlusOutlined, BarsOutlined, PieChartOutlined } from '@ant-design/icons';
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

  const loadCategories = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  }, []);

  const loadRecords = useCallback(async () => {
    const data = await getRecords(100, 0);
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
      const today = dayjs().format('YYYY-MM-DD');
      await addRecord(id, amount, categoryId, note, today);
      message.success('记录成功！');
      setShowAddModal(false);
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
      message.success('已删除');
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

  const groupedRecords: Record<string, RecordItem[]> = {};
  records.forEach((r) => {
    if (!groupedRecords[r.recordDate]) {
      groupedRecords[r.recordDate] = [];
    }
    groupedRecords[r.recordDate].push(r);
  });

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
          }}
        >
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-area">
        {activeTab === 'records' && (
          <div>
            {records.length === 0 ? (
              <div className="empty-state">
                <div className="big-icon">📝</div>
                <p>还没有记账记录</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>
                  点击下方 "+" 按钮开始记账
                </p>
              </div>
            ) : (
              Object.entries(groupedRecords).map(([date, items]) => (
                <div className="date-group" key={date}>
                  <div className="date-header">
                    {dayjs(date).format('M月D日 ddd')}
                    <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                      共 {items.reduce((s, i) => s + i.amount, 0).toFixed(2)} 元
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
                      <div
                        className="amount"
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        -¥{item.amount.toFixed(2)}
                        <span
                          style={{ fontSize: 12, color: '#999', cursor: 'pointer' }}
                          onClick={() => handleDeleteRecord(item.id)}
                        >
                          ✕
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <StatPage
            monthlyStats={monthlyStats}
            monthlyTotal={monthlyTotal}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />
        )}

        {activeTab === 'add' && null}
      </div>

      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <BarsOutlined className="nav-icon" />
          <span>记录</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setShowAddModal(true)}
        >
          <PlusOutlined className="nav-icon" style={{ fontSize: 22 }} />
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
