// Strings Studio - simple beginner JavaScript
// Data is stored in this browser only. This is a demo, not secure authentication.

const USERS_KEY = "stringsStudioUsers";
const CURRENT_USER_KEY = "stringsStudioCurrentUser";
const BOOKINGS_KEY = "stringsStudioBookings";

function readData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

// Login/register modal on the home page
const modal = document.getElementById("authModal");
const openLogin = document.getElementById("openLogin");
const closeModal = document.getElementById("closeModal");

if (openLogin && modal) {
  openLogin.addEventListener("click", () => modal.classList.remove("hidden"));
}
if (closeModal && modal) {
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));
}
if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  });
}

const authForm = document.getElementById("authForm");

if (authForm) {

  authForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    const message = document.getElementById("authMessage");

    if (!name || !email || password.length < 4) {

      message.textContent = "Please fill every field. Password must be at least 4 characters.";

      return;

    }

    try {

      let response = await fetch("/api/register", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        credentials: "same-origin",

        body: JSON.stringify({ name, email, password })

      });

      let result = await response.json();

      // If the email already exists, try logging in instead.

      if (!response.ok && response.status === 400) {

        response = await fetch("/api/login", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          credentials: "same-origin",

          body: JSON.stringify({ email, password })

        });

        result = await response.json();

      }

      if (!response.ok) {

        throw new Error(result.message || "Something went wrong.");

      }

      message.textContent = "Success! Opening your dashboard...";

      window.location.href = "dashboard.html";

    } catch (error) {

      message.textContent = error.message;

    }

  });

}
// Book a lesson using MongoDB

document.querySelectorAll(".book-button").forEach((button) => {

  button.addEventListener("click", async () => {

    const lessonName = button.dataset.lesson;

    const lessonDate = new Date().toLocaleDateString();

    try {

      const response = await fetch("/api/bookings", {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        credentials: "same-origin",

        body: JSON.stringify({

          lesson: lessonName,

          lessonDate: lessonDate

        })

      });

      const result = await response.json();

      if (!response.ok) {

        showToast(result.message || "Please log in before booking.");

        return;

      }

      showToast(lessonName + " booked successfully!");

    } catch (error) {

      showToast("Could not save booking. Please try again.");

      console.error(error);

    }

  });

});

// Dashboard: load user and bookings from MongoDB

async function renderDashboard() {

  const studentName = document.getElementById("studentName");

  const bookingList = document.getElementById("bookingList");

  const emptyBookings = document.getElementById("emptyBookings");

  const bookingCount = document.getElementById("bookingCount");

  try {

    const userResponse = await fetch("/api/me", {

      credentials: "same-origin"

    });

    if (!userResponse.ok) {

      window.location.href = "index.html";

      return;

    }

    const currentUser = await userResponse.json();

    if (studentName) {

      studentName.textContent = currentUser.name || "Guitar Learner";

    }

    const bookingResponse = await fetch("/api/bookings", {

      credentials: "same-origin"

    });

    const bookings = await bookingResponse.json();

    if (!bookingResponse.ok) {

      throw new Error("Could not load bookings");

    }

    if (bookingCount) {

      bookingCount.textContent = String(bookings.length);

    }

    if (bookingList) {

      bookingList.innerHTML = "";

      bookings.forEach((booking) => {

        const item = document.createElement("article");

        item.className = "booking-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");

        title.textContent = booking.lesson;

        const date = document.createElement("p");

        date.textContent = "Booked on: " + booking.lessonDate;

        details.append(title, date);

        const cancelButton = document.createElement("button");

        cancelButton.textContent = "Cancel booking";

        cancelButton.addEventListener("click", async () => {

          const deleteResponse = await fetch(

            "/api/bookings/" + booking._id,

            {

              method: "DELETE",

              credentials: "same-origin"

            }

          );

          if (deleteResponse.ok) {

            showToast("Booking cancelled.");

            renderDashboard();

          } else {

            showToast("Could not cancel booking.");

          }

        });

        item.append(details, cancelButton);

        bookingList.appendChild(item);

      });

    }

    if (emptyBookings) {

      emptyBookings.style.display =

        bookings.length === 0 ? "block" : "none";

    }

  } catch (error) {

    console.error("Dashboard error:", error);

    showToast("Could not load dashboard.");

  }

}

renderDashboard();

// Logout using the server session

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {

  logoutButton.addEventListener("click", async () => {

    await fetch("/api/logout", {

      method: "POST",

      credentials: "same-origin"

    });

    window.location.href = "index.html";

  });

}
