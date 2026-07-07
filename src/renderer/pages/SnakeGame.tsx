import React, { useEffect, useRef, useState, useCallback } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'idle' | 'playing' | 'paused' | 'over';

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 22;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;

const DIFFICULTY = {
  easy: { label: '简单', speed: 180, color: '#52c41a' },
  normal: { label: '普通', speed: 120, color: '#1677ff' },
  hard: { label: '困难', speed: 80, color: '#fa8c16' },
  insane: { label: '地狱', speed: 50, color: '#ff4d4f' },
};

type DifficultyKey = keyof typeof DIFFICULTY;

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const v = localStorage.getItem('snake_high_score');
      return v ? parseInt(v, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [difficulty, setDifficulty] = useState<DifficultyKey>('normal');

  const genFood = useCallback(() => {
    const snake = snakeRef.current;
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let f: Point;
    let tries = 0;
    do {
      f = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      tries++;
      if (tries > 500) break;
    } while (occupied.has(`${f.x},${f.y}`));
    foodRef.current = f;
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    setScore(0);
    genFood();
  }, [genFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景渐变
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    bgGrad.addColorStop(0, '#f6f8ff');
    bgGrad.addColorStop(1, '#eef2ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 网格线
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_W, i * CELL_SIZE);
      ctx.stroke();
    }

    // 食物 - 带光晕
    const food = foodRef.current;
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL_SIZE);
    glow.addColorStop(0, 'rgba(255, 77, 79, 0.5)');
    glow.addColorStop(1, 'rgba(255, 77, 79, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(food.x * CELL_SIZE - CELL_SIZE / 2, food.y * CELL_SIZE - CELL_SIZE / 2, CELL_SIZE * 2, CELL_SIZE * 2);
    ctx.fillStyle = '#ff4d4f';
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(fx - 3, fy - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // 蛇身
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const x = seg.x * CELL_SIZE;
      const y = seg.y * CELL_SIZE;
      const isHead = idx === 0;
      const pad = isHead ? 1 : 2;

      // 渐变色
      const ratio = idx / Math.max(snake.length - 1, 1);
      const r = Math.round(102 - ratio * 30);
      const g = Math.round(126 - ratio * 20);
      const b = Math.round(234 - ratio * 60);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      const r2 = isHead ? 7 : 5;
      ctx.beginPath();
      const px = x + pad;
      const py = y + pad;
      const pw = CELL_SIZE - pad * 2;
      const ph = CELL_SIZE - pad * 2;
      ctx.moveTo(px + r2, py);
      ctx.lineTo(px + pw - r2, py);
      ctx.quadraticCurveTo(px + pw, py, px + pw, py + r2);
      ctx.lineTo(px + pw, py + ph - r2);
      ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r2, py + ph);
      ctx.lineTo(px + r2, py + ph);
      ctx.quadraticCurveTo(px, py + ph, px, py + ph - r2);
      ctx.lineTo(px, py + r2);
      ctx.quadraticCurveTo(px, py, px + r2, py);
      ctx.closePath();
      ctx.fill();

      // 蛇头眼睛
      if (isHead) {
        const dir = dirRef.current;
        ctx.fillStyle = '#fff';
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        let e1x = cx, e1y = cy, e2x = cx, e2y = cy;
        if (dir === 'RIGHT') {
          e1x = cx + 4; e1y = cy - 4; e2x = cx + 4; e2y = cy + 4;
        } else if (dir === 'LEFT') {
          e1x = cx - 4; e1y = cy - 4; e2x = cx - 4; e2y = cy + 4;
        } else if (dir === 'UP') {
          e1x = cx - 4; e1y = cy - 4; e2x = cx + 4; e2y = cy - 4;
        } else {
          e1x = cx - 4; e1y = cy + 4; e2x = cx + 4; e2y = cy + 4;
        }
        ctx.beginPath();
        ctx.arc(e1x, e1y, 3, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1f1f1f';
        ctx.beginPath();
        ctx.arc(e1x, e1y, 1.5, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  const step = useCallback(() => {
    // 更新方向
    dirRef.current = nextDirRef.current;
    const dir = dirRef.current;
    const snake = snakeRef.current;
    const head = snake[0];
    let newHead: Point;
    if (dir === 'UP') newHead = { x: head.x, y: head.y - 1 };
    else if (dir === 'DOWN') newHead = { x: head.x, y: head.y + 1 };
    else if (dir === 'LEFT') newHead = { x: head.x - 1, y: head.y };
    else newHead = { x: head.x + 1, y: head.y };

    // 撞墙
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }
    // 撞自己
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
        endGame();
        return;
      }
    }

    const food = foodRef.current;
    const ateFood = newHead.x === food.x && newHead.y === food.y;
    const newSnake = [newHead, ...snake];
    if (!ateFood) newSnake.pop();
    snakeRef.current = newSnake;

    if (ateFood) {
      setScore(s => {
        const ns = s + 10;
        setHighScore(h => {
          if (ns > h) {
            try { localStorage.setItem('snake_high_score', String(ns)); } catch { /* noop */ }
            return ns;
          }
          return h;
        });
        return ns;
      });
      genFood();
    }
    draw();
  }, [draw, genFood]);

  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('over');
    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    if (status === 'over' || status === 'idle') resetGame();
    if (timerRef.current) clearInterval(timerRef.current);
    const speed = DIFFICULTY[difficulty].speed;
    timerRef.current = window.setInterval(step, speed);
    setStatus('playing');
    draw();
  }, [difficulty, draw, resetGame, step, status]);

  const pauseGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('paused');
  }, []);

  const resumeGame = useCallback(() => {
    if (timerRef.current) return;
    const speed = DIFFICULTY[difficulty].speed;
    timerRef.current = window.setInterval(step, speed);
    setStatus('playing');
  }, [difficulty, step]);

  // 键盘控制
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let wantDir: Direction | null = null;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') wantDir = 'UP';
      else if (k === 'ArrowDown' || k === 's' || k === 'S') wantDir = 'DOWN';
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') wantDir = 'LEFT';
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') wantDir = 'RIGHT';
      else if (k === ' ') {
        e.preventDefault();
        if (status === 'playing') pauseGame();
        else if (status === 'paused') resumeGame();
        else if (status === 'idle' || status === 'over') startGame();
        return;
      }
      if (wantDir) {
        e.preventDefault();
        const cur = dirRef.current;
        const opposite =
          (cur === 'UP' && wantDir === 'DOWN') ||
          (cur === 'DOWN' && wantDir === 'UP') ||
          (cur === 'LEFT' && wantDir === 'RIGHT') ||
          (cur === 'RIGHT' && wantDir === 'LEFT');
        if (!opposite) nextDirRef.current = wantDir;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, pauseGame, resumeGame, startGame]);

  // 初始绘制 + 清理
  useEffect(() => {
    genFood();
    draw();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [draw, genFood]);

  // 难度切换时重置计时
  useEffect(() => {
    if (status === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(step, DIFFICULTY[difficulty].speed);
    }
  }, [difficulty, status, step]);

  const diffInfo = DIFFICULTY[difficulty];

  return (
    <div className="stat-container">
      <div className="page-header">
        <div className="header-title" style={{ marginBottom: 0 }}>🐍 贪吃蛇 · 记账间隙放松一下</div>
        <div className="header-subtitle">
          方向键 / WASD 控制 · 空格暂停继续 · 吃到红色食物 +10 分
        </div>
        <div className="header-stats">
          <div className="header-stat-card">
            <div className="stat-label">当前得分</div>
            <div className="stat-value" style={{ color: '#667eea' }}>
              {score}
              <span className="stat-unit">分</span>
            </div>
          </div>
          <div className="header-stat-card">
            <div className="stat-label">历史最高</div>
            <div className="stat-value" style={{ color: '#faad14' }}>
              {highScore}
              <span className="stat-unit">分</span>
            </div>
          </div>
          <div className="header-stat-card">
            <div className="stat-label">蛇身长度</div>
            <div className="stat-value" style={{ color: '#52c41a' }}>
              {snakeRef.current.length}
              <span className="stat-unit">格</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* 游戏画布 */}
          <div>
            <div
              style={{
                position: 'relative',
                padding: 16,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #ffffff 0%, #f6f8ff 100%)',
                boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{
                  display: 'block',
                  borderRadius: 12,
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}
              />
              {status !== 'playing' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    right: 16,
                    bottom: 16,
                    borderRadius: 12,
                    background: status === 'over'
                      ? 'rgba(255, 77, 79, 0.12)'
                      : 'rgba(22, 119, 255, 0.12)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {status === 'idle' && (
                    <>
                      <div style={{ fontSize: 56, marginBottom: 8 }}>🐍</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1f1f1f', marginBottom: 6 }}>
                        准备好了吗？
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        点击下方「开始游戏」或按空格键启动
                      </div>
                    </>
                  )}
                  {status === 'paused' && (
                    <>
                      <div style={{ fontSize: 56, marginBottom: 8 }}>⏸️</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff', marginBottom: 6 }}>
                        游戏暂停中
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        点击「继续」或按空格键继续游戏
                      </div>
                    </>
                  )}
                  {status === 'over' && (
                    <>
                      <div style={{ fontSize: 56, marginBottom: 8 }}>💥</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f', marginBottom: 6 }}>
                        游戏结束！
                      </div>
                      <div style={{ fontSize: 15, color: '#1f1f1f', marginBottom: 2 }}>
                        本局得分 <b style={{ color: '#667eea' }}>{score}</b> 分
                      </div>
                      {score > 0 && score >= highScore && (
                        <div style={{ fontSize: 13, color: '#faad14', fontWeight: 600, marginBottom: 4 }}>
                          🎉 创造了新纪录！
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#999' }}>
                        点击「再来一局」或按空格键开始新游戏
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 控制面板 */}
          <div style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fff 0%, #f9fbff 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f', marginBottom: 14 }}>
                🎮 游戏控制
              </div>

              {/* 难度选择 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>难度等级</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(Object.keys(DIFFICULTY) as DifficultyKey[]).map((k) => {
                    const d = DIFFICULTY[k];
                    const active = difficulty === k;
                    return (
                      <div
                        key={k}
                        onClick={() => setDifficulty(k)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 10,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: active ? 600 : 500,
                          color: active ? '#fff' : d.color,
                          background: active ? d.color : `${d.color}15`,
                          border: `1px solid ${active ? d.color : `${d.color}40`}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {d.label}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                          {d.speed}ms/步
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {(status === 'idle' || status === 'over') && (
                  <div
                    onClick={startGame}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 28,
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      color: '#fff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 15,
                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.35)',
                    }}
                  >
                    {status === 'over' ? '🔄 再来一局' : '▶️ 开始游戏'}
                  </div>
                )}
                {status === 'playing' && (
                  <div
                    onClick={pauseGame}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 28,
                      background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                      color: '#fff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 15,
                      boxShadow: '0 4px 12px rgba(250, 173, 20, 0.35)',
                    }}
                  >
                    ⏸️ 暂停
                  </div>
                )}
                {status === 'paused' && (
                  <>
                    <div
                      onClick={resumeGame}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: 28,
                        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        color: '#fff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 15,
                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.35)',
                      }}
                    >
                      ▶️ 继续
                    </div>
                    <div
                      onClick={() => { resetGame(); setStatus('idle'); draw(); }}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: 28,
                        border: '1px solid #d9d9d9',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: 15,
                        color: '#666',
                      }}
                    >
                      🔄 重新开始
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 操作说明 */}
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)',
                border: '1px solid rgba(250, 173, 20, 0.25)',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#d48806', marginBottom: 10 }}>
                📖 操作说明
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                <div>⬆️⬇️⬅️➡️ 方向键 — 控制蛇移动方向</div>
                <div>W A S D 键 — 另一种方向控制方式</div>
                <div>⎵ 空格键 — 开始 / 暂停 / 继续</div>
                <div>🍎 吃红色食物 — 蛇身变长 +10 分</div>
                <div>💥 撞墙或撞到自己 — 游戏结束</div>
              </div>
            </div>

            {/* 移动端方向键 */}
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fff 0%, #f5f7ff 100%)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f', marginBottom: 12, textAlign: 'center' }}>
                📱 触屏方向控制
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 8,
                  maxWidth: 200,
                  margin: '0 auto',
                }}
              >
                <div />
                <DirBtn label="▲" onClick={() => {
                  if (dirRef.current !== 'DOWN') nextDirRef.current = 'UP';
                }} />
                <div />
                <DirBtn label="◀" onClick={() => {
                  if (dirRef.current !== 'RIGHT') nextDirRef.current = 'LEFT';
                }} />
                <div
                  style={{
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${diffInfo.color}20, ${diffInfo.color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {status === 'playing' ? '🐍' : '🎯'}
                </div>
                <DirBtn label="▶" onClick={() => {
                  if (dirRef.current !== 'LEFT') nextDirRef.current = 'RIGHT';
                }} />
                <div />
                <DirBtn label="▼" onClick={() => {
                  if (dirRef.current !== 'UP') nextDirRef.current = 'DOWN';
                }} />
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DirBtn: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <div
    onClick={onClick}
    style={{
      aspectRatio: '1 / 1',
      borderRadius: 12,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
      userSelect: 'none',
      transition: 'transform 0.1s',
    }}
    onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.92)'; }}
    onMouseUp={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
  >
    {label}
  </div>
);

export default SnakeGame;
