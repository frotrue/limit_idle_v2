let showAlertFn = (message, title) => console.log(title, message);
let showConfirmFn = (message, onConfirm) => {
  if (typeof globalThis.confirm === 'function' && globalThis.confirm(message)) onConfirm();
};

export const setGameUiCallbacks = (alertCb, confirmCb) => {
  if (typeof alertCb === 'function') showAlertFn = alertCb;
  if (typeof confirmCb === 'function') showConfirmFn = confirmCb;
};

export const showGameAlert = (message, title = '알림') => {
  showAlertFn(message, title);
};

export const showGameConfirm = (message, onConfirm, title = '확인') => {
  showConfirmFn(message, onConfirm, title);
};
