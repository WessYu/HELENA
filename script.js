const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-counter]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-panel a");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const target = entry.target;
      const finalValue = Number(target.dataset.counter);
      const duration = 1400;
      const start = performance.now();

      const updateCounter = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        target.textContent = Math.round(finalValue * eased);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
      counterObserver.unobserve(target);
    });
  },
  { threshold: 0.45 },
);

counters.forEach((counter) => counterObserver.observe(counter));

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
  });
}

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
  });
});
