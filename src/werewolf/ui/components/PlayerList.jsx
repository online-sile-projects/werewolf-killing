import React from 'react';
import '../styles/PlayerList.css';

/**
 * 玩家列表元件
 * 顯示所有玩家及其狀態
 */
function PlayerList({ players = [] }) {
  // 如果沒有玩家，顯示載入中
  if (players.length === 0) {
    return (
      <div className="player-list">
        <h2>玩家列表</h2>
        <div className="loading-players">載入中...</div>
      </div>
    );
  }

  return (
    <div className="player-list">
      <h2>玩家列表</h2>
      <ul>
        {players.map(player => (
          <li 
            key={player.id} 
            className={`player-item ${!player.isAlive ? 'dead' : ''} ${player.isHuman ? 'human' : ''}`}
          >
            <div className="player-status">
              {player.isAlive ? (
                <span className="alive-indicator">●</span>
              ) : (
                <span className="dead-indicator">✝</span>
              )}
            </div>
            <div className="player-info">
              <div className="player-name">
                {player.name} {player.isHuman && '(你)'}
              </div>
              <div className="player-id">ID: {player.id}</div>
            </div>
            {player.isHuman && player.role && (
              <div className="player-role">{player.role}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList;
