import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  onSave: (amount: number, categoryId: number, note: string) => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const AddRecordModal: React.FC<Props> = ({ categories, onSave, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState<number | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'amount' | 'category'>('amount');

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
    onSave(parseFloat(amount), selectedSubCat, note);
  };

  const handleReset = () => {
    setStep('amount');
    setSelectedMainCat(null);
    setSelectedSubCat(null);
  };

  const currentMainCat = categories.find(c => c.id === selectedMainCat);

  return (
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
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>记账金额</div>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#ff4d4f' }}>
              ¥{parseFloat(amount).toFixed(2)}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {selectedMainCat ? currentMainCat?.name : '选择大类'}
              </h4>
              {selectedMainCat && (
                <span
                  onClick={() => { setSelectedMainCat(null); setSelectedSubCat(null); }}
                  style={{ cursor: 'pointer', fontSize: 13, color: '#1677ff' }}
                >
                  ← 更换分类
                </span>
              )}
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
              <div style={{ fontSize: 13, color: '#999', marginBottom: 10 }}>
                选择具体分类（当前：<span style={{ color: '#1677ff' }}>
                  {currentMainCat?.children.find(c => c.id === selectedSubCat)?.name || '未选择'}
                </span>）
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
  );
};

export default AddRecordModal;
