
//EMAIL VALIDATION: Grabs the email input, button, and error text from HTML
const emailInput = document.getElementById("email");
const btn = document.getElementById("getStarted");
const errorText = document.getElementById("emailError");

// Regex check — returns true if email format is valid
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 
// Main validation function: force = true means user clicked button or left the field (show strong error)
// force = false means user is still typing (soft/no error)
function validateEmail(force = false) {
  const value = emailInput.value.trim();
  const valid = isValidEmail(value);

  // Add "invalid" class if value exists but is wrong format
  emailInput.classList.toggle("invalid", !valid && value !== "");

  if (force) {
    emailInput.classList.add("touched");
    errorText.classList.toggle("show", !valid);
  } else {
    emailInput.classList.remove("touched");
    errorText.classList.remove("show");
  }

  // If email becomes valid — remove all error styles
  if (valid) {
    emailInput.classList.remove("invalid", "touched");
    errorText.classList.remove("show");
  }

  return valid;
}

// While typing (soft validation)
emailInput.addEventListener("input", () => {
  validateEmail(false);
});

// On blur (lost focus → strong warning)
emailInput.addEventListener("blur", () => {
  validateEmail(true);
});

// On button click (force validation)
btn.addEventListener("click", () => {
  if (validateEmail(true)) {
    console.log("Valid email:", emailInput.value);
  }
});


//RENDING SLIDER — scroll buttons: Left/right buttons scroll the movie cards horizontally
const slider = document.getElementById("cardSlider");
const leftBtn = document.getElementById("slideLeftBtn");
const rightBtn = document.getElementById("slideRightBtn");

// Hide left button if at start, hide right button if at end
function updateButtons() {
  const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

  if (slider.scrollLeft <= 0) {
    leftBtn.classList.add("hidden");
  } else {
    leftBtn.classList.remove("hidden");
  }

  if (slider.scrollLeft >= maxScrollLeft - 1) {
    rightBtn.classList.add("hidden");
  } else {
    rightBtn.classList.remove("hidden");
  }
}

// Scroll left or right by 400px on button click
leftBtn.addEventListener("click", () => (slider.scrollLeft -= 400));
rightBtn.addEventListener("click", () => (slider.scrollLeft += 400));

// Re-check button visibility whenever slider is scrolled
slider.addEventListener("scroll", updateButtons);
updateButtons();


// DARK / LIGHT THEME TOGGLE: Detects system preference, saves user choice to localStorage
const themeBtn = document.getElementById("themeBtn");
const body = document.body;

// Check if system is set to dark mode
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
console.log("System theme detected:", systemDark ? "dark" : "light");

const savedTheme = localStorage.getItem("theme");

// If user previously chose a theme — use that, otherwise use system preference
if (savedTheme) {
  body.classList.add(savedTheme);
} else {
  body.classList.add(systemDark ? "dark" : "light");
}

// Toggle between dark and light on button click, save to localStorage
themeBtn.addEventListener("click", () => {
  const isDark = body.classList.contains("dark");
  body.classList.toggle("dark", !isDark);
  body.classList.toggle("light", isDark);
  localStorage.setItem("theme", isDark ? "light" : "dark");
});

// If system theme changes and user hasn't manually chosen — follow system preference
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      body.classList.toggle("dark", e.matches);
      body.classList.toggle("light", !e.matches);
    }
  });

  
// SCROLL TO TOP BUTTON: Button appears after scrolling 300px, clicking scrolls back to to
window.addEventListener("load", () => {
  const scrollTopBtn = document.getElementById("scrollTop");

  // Show or hide button based on scroll position
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });
// Smooth scroll to top on click
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});


// FETCH TRENDING MOVIES FROM TMDB: Fills hero collage (top 4) and slider cards (next 10)
// Shows skeleton placeholders while loading
async function loadTrendingMovies() {
  const heroCollage = document.getElementById("heroCollage");

  // Show skeleton loading images in hero collage while fetching
  heroCollage.innerHTML = Array(4)
    .fill( ` <div class="hero-skeleton"></div>`,)
    .join("");

  // Show skeleton loading cards in slider while fetching
  slider.innerHTML = Array(10)
    .fill(`<div class="card skeleton"></div>`,)
    .join("");

  try {
    const response = await fetch(
      "https://api.themoviedb.org/3/trending/movie/week",
      {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    const movies = data.results;

     // Fill hero collage with first 4 movie posters
    heroCollage.innerHTML = movies
      .slice(0, 4)
      .map(
        (movie) => `
      <img
        src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
        alt="${movie.title}"
      />
    `,
 )
      .join("");

      //Fill slider with next 10 movies (index 4 to 14)
    // data-* attributes store movie info for the modal
    slider.innerHTML = movies
      .slice(4, 14)
      .map(
        (movie) => `
  <div class="card" 
    data-title="${movie.title}"
    data-overview="${movie.overview}"
    data-rating="${movie.vote_average.toFixed(1)}"
    data-poster="https://image.tmdb.org/t/p/w500${movie.poster_path}">
    <img
      src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
      alt="${movie.title}"
      loading="lazy"
    />
    <div class="card-title">${movie.title}</div>
  </div>
`,
      )
      .join("");

    updateButtons(); // re-check scroll button visibility after cards load
  } catch (error) {
    // Show error message if fetch fails
    slider.innerHTML = `<p style="color:red; padding: 20px;">Failed to load movies. Check your API token.</p>`;
    heroCollage.innerHTML = ``;
    console.error("TMDB fetch error:", error);
  }
}

loadTrendingMovies(); // run on page load
//  Movie Modal logic
// Clicking a card opens a modal with poster, title, rating, overview. Clicking outside or on close button closes the modal.
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");

// Open modal on card click
slider.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return; // ignore clicks outside cards

  document.getElementById("modalPoster").src = card.dataset.poster;
  document.getElementById("modalTitle").textContent = card.dataset.title;
  document.getElementById("modalRating").textContent =
    "⭐ " + card.dataset.rating + " / 10";
  document.getElementById("modalOverview").textContent = card.dataset.overview;

  modalOverlay.classList.add("open"); // show modal
});

// Close modal
modalClose.addEventListener("click", () =>
  modalOverlay.classList.remove("open"),
);
// Close modal when clicking outside the modal box (on the dark overlay)
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("open");
});
// Genre filter
// Clicking a pill fetches movies by that genre from TMDB
// "All" pill resets to trending movies
document.getElementById("genrePills").addEventListener("click", async (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return; // ignore clicks outside pills

  // Remove active style from all pills, add to clicked one
  document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");

  const genreId = pill.dataset.id;

  // Show skeletons while new movies load
  slider.innerHTML = Array(10)
    .fill(`<div class="card skeleton"></div>`)
    .join("");

    // If genreId exists use discover endpoint, otherwise fetch trending movies
  const url = genreId
    ? `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`
    : `https://api.themoviedb.org/3/trending/movie/week`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });

  const data = await res.json();

  // Fill slider with filtered movies
  slider.innerHTML = data.results
    .slice(0, 10)
    .map(
      (movie) => `
    <div class="card"
      data-title="${movie.title}"
      data-overview="${movie.overview}"
      data-rating="${movie.vote_average.toFixed(1)}"
      data-poster="https://image.tmdb.org/t/p/w500${movie.poster_path}">
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
        alt="${movie.title}" loading="lazy" />
      <div class="card-title">${movie.title}</div>
    </div>
  `,
    )
    .join("");

  updateButtons(); // re-check scroll buttons after new cards load
});
