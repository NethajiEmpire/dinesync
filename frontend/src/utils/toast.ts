export const toast = {
  success: (message, title = 'Success') =>
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message,
        title,
        type: 'success'
      }
    })),
  error: (message, title = 'Error') =>
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message,
        title,
        type: 'error'
      }
    })),
  info: (message, title = 'Info') =>
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message,
        title,
        type: 'info'
      }
    }))
};
