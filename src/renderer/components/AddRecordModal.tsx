import React, { useState } from 'react';
import { Modal, Input, message, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { Category } from '../types';
import { addCategory } from '../utils/database';

interface Props {
  categories: Category[];
  onSave: (amount: number, categoryId: number, note: string, recordDate: string) => void;
  onCancel: () => void;
  onCategoryAdded?: () => Promise<void>;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];
const ICON_POOL = ['🍜', '🚗', '🛒', '🏠', '💬', '🎮', '🏥', '📚', '🎁', '🚙', '👶', '💼', '💇', '🐕', '📦', '🎯', '💡', '⚡', '🎨', '🎵', '🏆', '🌱', '🎪', '🧸', '🛍️', '📌'];

const AddRecordModal: React.FC<Props> = ({ categories, onSave, onCancel, onCategoryAdded }) => {
  const [amount, setAmount] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState<number | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [recordDate, setRecordDate] = useState<Dayjs>(dayjs());
  const [step, setStep] = useState<'amount' | 'category'>('amount');
  const [addCatVisible, setAddCatVisible] = useState(false);
  const [addCatMode, setAddCatMode] = useState<'main' | 'sub'>('main');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [saving, setSaving] = useState(false);

  const handleAmountConfirm = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      message.warning('请输入有效金额');
      return;
    }
    if (num > 99999999) {
      message.warning('金额过大');
      return;
    }
    setStep('category');
  };

  const handleMainCatSelect = (catId: number) => {
    setSelectedMainCat(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.children && cat.children.length > 0) {
      setSelectedSubCat(cat.children[0].id);
    } else {
      setSelectedSubCat(null);
    }
  };

  const handleCategorySelect = () => {
    if (!selectedMainCat) {
      message.warning('请选择分类');
      return;
    }
    if (!selectedSubCat) {
      message.warning('请选择具体的子分类');
      return;
    }
    const dateStr = recordDate.format('YYYY-MM-DD');
    onSave(parseFloat(amount), selectedSubCat, note, dateStr);
  };

  const handleReset = () => {
    setStep('amount');
    setSelectedMainCat(null);
    setSelectedSubCat(null);
  };

  const openAddCategory = (mode: 'main' | 'sub') => {
    setAddCatMode(mode);
    setNewCatName('');
    setNewCatIcon('📌');
    setAddCatVisible(true);
  };

  const handleConfirmAddCategory = async () => {
    if (!newCatName.trim()) {
      message.warning('请输入分类名称');
      return;
    }
    try {
      setSaving(true);
      const parentId = addCatMode === 'sub' ? selectedMainCat ?? undefined : undefined;
      await addCategory(newCatName.trim(), addCatMode === 'main' ? newCatIcon : undefined, parentId);
      message.success(`🎉 新${addCatMode === 'main' ? '大' : '子'}分类「${newCatName.trim()}」添加成功`);
      setAddCatVisible(false);
      if (onCategoryAdded) await onCategoryAdded();
      if (addCatMode === 'sub' && selectedMainCat != null) {
        const cat = categories.find(c => c.id === selectedMainCat);
        if (cat && cat.children?.length) {
          setSelectedSubCat(cat.children[cat.children.length - 1]?.id ?? cat.children[0].id);
        }
      }
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '新增分类失败');
    } finally {
      setSaving(false);
    }
  };

  const currentMainCat = categories.find(c => c.id === selectedMainCat);

  return (
    <>
      <Modal
        open
        onCancel={onCancel}
        footer={null}
        width={460}
        centered
        closable
        destroyOnClose
        title={
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 600 }}>
            {step === 'amount' ? '💰 记一笔支出' : '📂 选择分类'}
          </div>
        }
      >
        {step === 'amount' ? (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>记账日期（可补记历史账单）</div>
              <Space.Compact style={{ width: '100%' }}>
                <DatePicker
                  value={recordDate}
                  onChange={(d) => d && setRecordDate(d)}
                  allowClear={false}
                  format="YYYY年MM月DD日"
                  size="large"
                  style={{ width: '100%' }}
                  disabledDate={(d) => d && d.isAfter(dayjs().endOf('day'))}
                />
              </Space.Compact>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>支出金额</div>
              <Input
                className="amount-input"
                placeholder="0.00"
                prefix={<span style={{ fontSize: 24, color: '#333' }}>¥</span>}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.]/g, '');
                  const parts = val.split('.');
                  if (parts.length > 2) return;
                  if (parts[1]?.length > 2) return;
                  setAmount(val);
                }}
                autoFocus
                onPressEnter={handleAmountConfirm}
                variant="borderless"
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>快捷金额</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {QUICK_AMOUNTS.map((q) => (
                  <div
                    key={q}
                    onClick={() => setAmount(String(q))}
                    style={{
                      flex: 1,
                      minWidth: 80,
                      padding: '10px 0',
                      textAlign: 'center',
                      borderRadius: 10,
                      background: amount === String(q) ? '#e6f4ff' : '#f7f8fa',
                      border: `1px solid ${amount === String(q) ? '#1677ff' : '#eef0f3'}`,
                      color: amount === String(q) ? '#1677ff' : '#333',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    ¥{q}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 28,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 15,
                  color: '#666',
                  transition: 'all 0.2s',
                }}
              >
                取消
              </div>
              <div
                onClick={handleAmountConfirm}
                style={{
                  flex: 2,
                  padding: '12px 0',
                  borderRadius: 28,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                下一步 →
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 20,
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
              }}
            >
              <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                📅 {recordDate.format('YYYY年MM月DD日')} · 记账金额
              </div>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#ff4d4f' }}>
                ¥{parseFloat(amount || '0').toFixed(2)}
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  {selectedMainCat ? currentMainCat?.name : '选择大类'}
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    onClick={() => openAddCategory('main')}
                    style={{ cursor: 'pointer', fontSize: 13, color: '#52c41a' }}
                  >
                    ➕ 新增大类
                  </span>
                  {selectedMainCat && (
                    <>
                      <span style={{ color: '#e5e5e5' }}>|</span>
                      <span
                        onClick={() => { setSelectedMainCat(null); setSelectedSubCat(null); }}
                        style={{ cursor: 'pointer', fontSize: 13, color: '#1677ff' }}
                      >
                        ← 更换分类
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="category-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-item ${selectedMainCat === cat.id ? 'selected' : ''}`}
                    onClick={() => handleMainCatSelect(cat.id)}
                  >
                    <span className="cat-icon">{cat.icon || '📦'}</span>
                    <span className="cat-name">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedMainCat && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    选择具体分类（当前：
                    <span style={{ color: '#1677ff' }}>
                      {currentMainCat?.children.find(c => c.id === selectedSubCat)?.name || '未选择'}
                    </span>
                    ）
                  </div>
                  <span
                    onClick={() => openAddCategory('sub')}
                    style={{ cursor: 'pointer', fontSize: 13, color: '#52c41a' }}
                  >
                    ➕ 新增子分类
                  </span>
                </div>
                <div className="sub-tags">
                  {currentMainCat?.children.map((sub) => (
                    <span
                      key={sub.id}
                      className={`sub-tag ${selectedSubCat === sub.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSubCat(sub.id)}
                    >
                      {sub.name}
                    </span>
                  ))}
                  {(!currentMainCat?.children?.length) && (
                    <div style={{ fontSize: 12, color: '#999', padding: '4px 0' }}>
                      该大类还没有子分类，点击上方「新增子分类」添加
                    </div>
                  )}
                </div>
              </div>
            )}

            <Input
              placeholder="📝 添加备注（选填，如：和朋友聚餐）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ marginTop: 12 }}
              variant="filled"
              size="large"
            />

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <div
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 28,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#666',
                }}
              >
                ← 修改金额
              </div>
              <div
                onClick={handleCategorySelect}
                style={{
                  flex: 2,
                  padding: '11px 0',
                  borderRadius: 28,
                  background: selectedSubCat
                    ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                    : 'linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: selectedSubCat ? '0 4px 12px rgba(82, 196, 26, 0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                ✓ 确认记账
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={addCatVisible}
        onCancel={() => setAddCatVisible(false)}
        onOk={handleConfirmAddCategory}
        confirmLoading={saving}
        okText="确认添加"
        cancelText="取消"
        title={
          <div style={{ fontWeight: 600 }}>
            ➕ 新增{addCatMode === 'main' ? '大' : '子'}分类
            {addCatMode === 'sub' && selectedMainCat ? (
              <span style={{ fontSize: 13, color: '#999', fontWeight: 400, marginLeft: 8 }}>
                （所属大类：{currentMainCat?.icon} {currentMainCat?.name}）
              </span>
            ) : null}
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>分类名称 *</div>
            <Input
              size="large"
              placeholder={`请输入${addCatMode === 'main' ? '大' : '子'}分类名称`}
              value={newCatName}
              maxLength={10}
              onChange={(e) => setNewCatName(e.target.value)}
              autoFocus
            />
          </div>
          {addCatMode === 'main' && (
            <div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>选择图标</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(13, 1fr)',
                  gap: 6,
                  padding: 10,
                  border: '1px solid #eee',
                  borderRadius: 10,
                }}
              >
                {ICON_POOL.map((ic) => (
                  <div
                    key={ic}
                    onClick={() => setNewCatIcon(ic)}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: newCatIcon === ic ? '#e6f4ff' : 'transparent',
                      border: newCatIcon === ic ? '1px solid #1677ff' : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {ic}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AddRecordModal;
