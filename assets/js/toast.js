let toastPlacement;
const toastPlacementExample = document.querySelector('.toast-placement-ex')

function toastDispose(toast) {
  if (toast && toast._element !== null) toast.dispose();
}

function showToast(type = 'bg-danger', title = 'Error!', message = 'Something went wrong!') {
  if (toastPlacement) {
    toastDispose(toastPlacement);
  }
  toastPlacementExample.classList.add(type);
  toastPlacement = new bootstrap.Toast(toastPlacementExample);
  document.querySelector('.toast-title').innerText = title;
  document.querySelector('.toast-body').innerText = message;
  toastPlacement.show();
}

function copyToClipboard(elId, iconId) {
  let el = document.querySelector(elId)
  let copyText = el.textContent || el.innerText || el.value || '';
  navigator.clipboard.writeText(copyText).then(() => {
    // showToast('bg-success', 'Success!', 'Copied to clipboard!');
    document.querySelector('.' + iconId).classList.remove('bx-copy');
    document.querySelector('.' + iconId).classList.add('bx-check');
    setTimeout(() => {
      document.querySelector('.' + iconId).classList.remove('bx-check');
      document.querySelector('.' + iconId).classList.add('bx-copy');
    }, 2000);
  }, (err) => {
    showToast('bg-danger', 'Error!', 'Failed to copy to clipboard!\n' + err);
    document.querySelector('.' + iconId).classList.remove('bx-copy');
    document.querySelector('.' + iconId).classList.add('bx-error');
    setTimeout(() => {
      document.querySelector('.' + iconId).classList.remove('bx-error');
      document.querySelector('.' + iconId).classList.add('bx-copy');
    }, 2000);
  });
}