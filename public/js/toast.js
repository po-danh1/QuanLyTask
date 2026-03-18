function showToast(message, type = "dark") {
  const toastEl = document.getElementById("appToast");
  const toastMsg = document.getElementById("toastMessage");

  if (!toastEl || !toastMsg) return;

  toastMsg.innerText = message;

  toastEl.className = `toast align-items-center text-bg-${type} border-0`;

  const toast = new bootstrap.Toast(toastEl, {
    delay: 2500
  });

  toast.show();
}
