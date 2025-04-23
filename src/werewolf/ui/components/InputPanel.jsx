import React, { useState, useEffect } from 'react';
import '../styles/InputPanel.css';

/**
 * 輸入面板元件
 * 處理玩家的回答和選擇
 */
function InputPanel({ question, options = [], isWaiting, onSubmit }) {
  // 設定狀態
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(-1);

  // 當問題或選項變化時重置輸入
  useEffect(() => {
    setAnswer('');
    setSelectedOption(-1);
  }, [question, options]);

  // 處理文字輸入提交
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (answer.trim() && onSubmit) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  // 處理選項選擇
  const handleOptionSelect = (index) => {
    setSelectedOption(index);
    // 如果是取消選項 (索引-1)，直接提交
    if (index === -1) {
      onSubmit(-1);
    }
  };

  // 處理選項提交
  const handleOptionSubmit = (e) => {
    e.preventDefault();
    if (selectedOption !== null && onSubmit) {
      onSubmit(selectedOption);
    }
  };

  // 處理是/否問題
  const handleYesNo = (isYes) => {
    onSubmit(isYes ? 'y' : 'n');
  };

  // 如果沒有問題或不在等待輸入狀態，顯示提示訊息
  if (!isWaiting || !question) {
    return (
      <div className="input-panel inactive">
        <div className="input-message">等待遊戲進行中...</div>
      </div>
    );
  }

  // 判斷問題類型
  const isYesNoQuestion = question.includes('(y/n)') || question.includes('y 或 n');
  const isOptionQuestion = options && options.length > 0;

  return (
    <div className="input-panel">
      <div className="question">
        <p>{question}</p>
      </div>

      {/* 是/否問題 */}
      {isYesNoQuestion && (
        <div className="yes-no-options">
          <button className="yes-btn" onClick={() => handleYesNo(true)}>是 (Y)</button>
          <button className="no-btn" onClick={() => handleYesNo(false)}>否 (N)</button>
        </div>
      )}

      {/* 選項列表 */}
      {isOptionQuestion && (
        <form onSubmit={handleOptionSubmit} className="option-form">
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="gameOption"
                  checked={selectedOption === index}
                  onChange={() => handleOptionSelect(index)}
                />
                <label htmlFor={`option-${index}`}>
                  {index + 1}. {option}
                </label>
              </div>
            ))}
            <div className="option-item">
              <input
                type="radio"
                id="option-cancel"
                name="gameOption"
                checked={selectedOption === -1}
                onChange={() => handleOptionSelect(-1)}
              />
              <label htmlFor="option-cancel">0. 取消</label>
            </div>
          </div>
          <button 
            type="submit" 
            className="submit-option-btn" 
            disabled={selectedOption === null}
          >
            確認選擇
          </button>
        </form>
      )}

      {/* 文字輸入 */}
      {!isYesNoQuestion && !isOptionQuestion && (
        <form onSubmit={handleTextSubmit} className="text-input-form">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="輸入您的回答..."
            className="text-input"
          />
          <button type="submit" className="submit-text-btn">
            提交
          </button>
        </form>
      )}
    </div>
  );
}

export default InputPanel;
