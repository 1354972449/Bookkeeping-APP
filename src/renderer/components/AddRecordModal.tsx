import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  onSave: (amount: number, categoryId: number, note: string) => void;
  onCancel: () => void;
}

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

  const handleCategorySelect = () => {
    if (!selectedSubCat) {
      message.warning('请选择分类');
      return;
    }
    onSave(parseFloat(amount), selectedSubCat, note);
  };

  const handleReset = () => {
    setStep('amount');
    setSelectedMainCat(null);
    setSelectedSubCat(null);
  };

  return (
    <Modal
      open
      onCancel={onCancel}
      footer={null}
      width={420}
      centered
      closable={false}
      destroyOnClose
    >
      {step === 'amount' ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h3 style={{ marginBottom: 24 }}>输入金额</h3>
          <Input
            className="amount-input"
            placeholder="0.00"
            prefix={<span style={{ fontSize: 20 }}>¥</span>}
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
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div
              onClick={onCancel}
              style={{
                padding: '10px 32px',
                borderRadius: 24,
                border: '1px solid #d9d9d9',
                cursor: 'pointer',
              }}
            >
              取消
            </div>
            <div
              onClick={handleAmountConfirm}
              style={{
                padding: '10px 32px',
                borderRadius: 24,
                background: '#1677ff',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              下一步
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>¥{parseFloat(amount).toFixed(2)}</span>
          </div>

          {!selectedMainCat ? (
            <>
              <h4 style={{ marginBottom: 12 }}>选择分类</h4>
              <div className="category-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="category-item"
                    onClick={() => setSelectedMainCat(cat.id)}
                  >
                    <span className="cat-icon">{cat.icon || '📦'}</span>
                    <span className="cat-name">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span
                  onClick={() => { setSelectedMainCat(null); setSelectedSubCat(null); }}
                  style={{ cursor: 'pointer', fontSize: 12, color: '#1677ff' }}
                >
                  ← 返回
                </span>
                <h4>{categories.find(c => c.id === selectedMainCat)?.name}</h4>
              </div>
              <div className="sub-tags">
                {categories
                  .find(c => c.id === selectedMainCat)
                  ?.children.map((sub) => (
                    <span
                      key={sub.id}
                      className={`sub-tag ${selectedSubCat === sub.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSubCat(sub.id)}
                    >
                      {sub.name}
                    </span>
                  ))}
              </div>
            </>
          )}

          <Input
            placeholder="添加备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ marginTop: 16 }}
            variant="filled"
          />

          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <div
              onClick={handleReset}
              style={{
                padding: '8px 24px',
                borderRadius: 24,
                border: '1px solid #d9d9d9',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              修改金额
            </div>
            <div
              onClick={handleCategorySelect}
              style={{
                padding: '8px 24px',
                borderRadius: 24,
                background: '#1677ff',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              保存
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddRecordModal;
