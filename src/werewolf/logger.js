/**
 * 建立格式化日誌紀錄工具
 */
export function createLogger() {
  // 定義樣式
  const styles = {
    title: 'color: #0099ff; font-weight: bold; font-size: 14px;',
    warning: 'color: #ff9900; font-weight: bold;',
    error: 'color: #ff3300; font-weight: bold;',
    success: 'color: #00cc66; font-weight: bold;',
    info: 'color: #9966ff;',
    normal: 'color: #666666;',
    player: 'color: #ff6699;',
    night: 'color: #3366ff; font-style: italic;',
    day: 'color: #ff9933; font-weight: bold;',
    role: 'color: #00cc99; font-weight: bold;',
    action: 'color: #cc6633;',
    dead: 'color: #cc0000; text-decoration: line-through;',
    system: 'color: #999999; font-style: italic;'
  };

  return {
    title: (text) => console.log(`%c${text}`, styles.title),
    warning: (text) => console.log(`%c${text}`, styles.warning),
    error: (text) => console.log(`%c${text}`, styles.error),
    success: (text) => console.log(`%c${text}`, styles.success),
    info: (text) => console.log(`%c${text}`, styles.info),
    normal: (text) => console.log(`%c${text}`, styles.normal),
    player: (text) => console.log(`%c${text}`, styles.player),
    night: (text) => console.log(`%c${text}`, styles.night),
    day: (text) => console.log(`%c${text}`, styles.day),
    role: (text) => console.log(`%c${text}`, styles.role),
    action: (text) => console.log(`%c${text}`, styles.action),
    dead: (text) => console.log(`%c${text}`, styles.dead),
    system: (text) => console.log(`%c${text}`, styles.system),
    divider: () => console.log('%c' + '-'.repeat(50), 'color: #cccccc;')
  };
}
