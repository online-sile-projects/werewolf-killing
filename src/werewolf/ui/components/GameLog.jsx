import React, { useEffect, useRef } from 'react';
import '../styles/GameLog.css';

/**
 * 遊戲紀錄元件
 * 顯示遊戲訊息和事件
 */
function GameLog({ messages = [] }) {
  // 建立參考，用於自動捲動
  const logEndRef = useRef(null);

  // 當新訊息出現時自動捲動到底部
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 判斷訊息類型並套用適當的樣式
  const getMessageClass = (type) => {
    switch (type) {
      case 'warning':
        return 'message-warning';
      case 'success':
        return 'message-success';
      case 'error':
        return 'message-error';
      case 'system':
        return 'message-system';
      case 'action':
        return 'message-action';
      case 'night':
        return 'message-night';
      case 'day':
        return 'message-day';
      case 'role':
        return 'message-role';
      case 'story':
        return 'message-story';
      default:
        return 'message-info';
    }
  };

  // 當沒有訊息時，顯示歡迎訊息
  if (messages.length === 0) {
    return (
      <div className="game-log">
        <div className="log-header">
          <h2>遊戲紀錄</h2>
        </div>
        <div className="log-content">
          <div className="log-message message-system">
            歡迎來到狼人殺遊戲！遊戲紀錄將顯示在這裡。
          </div>
          <div ref={logEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="game-log">
      <div className="log-header">
        <h2>遊戲紀錄</h2>
      </div>
      <div className="log-content">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`log-message ${getMessageClass(message.type)}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default GameLog;
