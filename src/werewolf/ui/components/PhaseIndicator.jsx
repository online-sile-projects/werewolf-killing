import React from 'react';
import '../styles/PhaseIndicator.css';

/**
 * 階段指示器元件
 * 顯示目前的遊戲階段和天數
 */
function PhaseIndicator({ phase, day }) {
  // 根據階段獲取對應的圖示和樣式
  const getPhaseInfo = () => {
    switch (phase) {
      case '夜晚':
      case '遊戲設置':
        return {
          icon: '🌙',
          className: 'phase-night',
          text: '夜晚'
        };
      case '白天討論':
        return {
          icon: '☀️',
          className: 'phase-day',
          text: '白天討論'
        };
      case '投票':
        return {
          icon: '✋',
          className: 'phase-voting',
          text: '投票'
        };
      case '遊戲結束':
        return {
          icon: '🏁',
          className: 'phase-end',
          text: '遊戲結束'
        };
      default:
        return {
          icon: '⏳',
          className: 'phase-default',
          text: phase || '準備中'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className={`phase-indicator ${phaseInfo.className}`}>
      <div className="phase-icon">{phaseInfo.icon}</div>
      <div className="phase-info">
        <div className="phase-day">第 {day || 0} 天</div>
        <div className="phase-name">{phaseInfo.text}</div>
      </div>
    </div>
  );
}

export default PhaseIndicator;
