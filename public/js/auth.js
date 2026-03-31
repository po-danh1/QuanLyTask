async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    showToast("Vui lòng nhập đầy đủ email và password", "warning");
    return;
  }

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast(data.message || "Login failed", "danger");
    return;
  }

  localStorage.setItem("token", data.token);
  showToast("Đăng nhập thành công", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

async function register() {
  const username = document.getElementById("username")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !email || !password) {
    showToast("Vui lòng nhập đầy đủ thông tin", "warning");
    return;
  }

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast(data.message || "Register failed", "danger");
    return;
  }

  showToast("Đăng ký thành công", "success");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

async function handleCredentialResponse(response) {
  try {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Google Login failed", "danger");
      return;
    }

    localStorage.setItem("token", data.token);
    showToast("Đăng nhập bằng Google thành công!", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  } catch (error) {
    showToast("Lỗi kết nối", "danger");
    console.error("Lỗi Google Auth:", error);
  }
}