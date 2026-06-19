const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-counter]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-panel a");
const healthIndicator = document.querySelector("[data-health-indicator]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
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

function setFeedback(element, type, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-feedback is-visible ${type === "success" ? "is-success" : "is-error"}`;
}

function clearFeedback(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "form-feedback";
}

function serializeForm(form) {
  const formData = new FormData(form);
  const payload = {};

  for (const [key, value] of formData.entries()) {
    if (payload[key] !== undefined) {
      continue;
    }

    if (value instanceof File) {
      continue;
    }

    payload[key] = typeof value === "string" ? value.trim() : value;
  }

  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    payload[input.name] = input.checked;
  });

  return payload;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Não foi possível concluir a solicitação.");
  }

  return data;
}

async function loadHealth() {
  if (!healthIndicator) {
    return;
  }

  try {
    await fetch("/api/health");
    healthIndicator.textContent = "Atendimento digital disponível";
  } catch (error) {
    healthIndicator.textContent = "Solicitação online temporariamente indisponível";
  }
}

function withLoadingState(form, isLoading) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) {
    return () => {};
  }

  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? "Enviando..." : button.dataset.originalLabel;
}

function wireForm(options) {
  const form = document.querySelector(options.formSelector);
  const feedback = document.querySelector(options.feedbackSelector);

  if (!form || !feedback) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback(feedback);
    withLoadingState(form, true);

    try {
      const payload = serializeForm(form);
      const data = await postJson(options.endpoint, payload);
      options.onSuccess(data, form, feedback);
    } catch (error) {
      setFeedback(feedback, "error", error.message);
    } finally {
      withLoadingState(form, false);
    }
  });
}

wireForm({
  formSelector: "#assessment-form",
  feedbackSelector: "#assessment-feedback",
  endpoint: "/api/consultations",
  onSuccess: (data, form, feedback) => {
    const record = data.record;
    setFeedback(
      feedback,
      "success",
      `Recebemos sua solicitação com sucesso. Seu protocolo é ${record.protocol}. Status atual: ${record.status}. Próxima etapa: ${record.nextStep}`,
    );
    form.reset();
  },
});

wireForm({
  formSelector: "#lookup-form",
  feedbackSelector: "#lookup-feedback",
  endpoint: "/api/consultations/lookup",
  onSuccess: (data, form, feedback) => {
    const record = data.record;
    setFeedback(
      feedback,
      "success",
      `Protocolo ${record.protocol}. Status atual: ${record.status}. Área: ${record.area}. Prioridade: ${record.urgency}. Próxima etapa: ${record.nextStep}`,
    );
    form.reset();
  },
});

wireForm({
  formSelector: "#contact-form",
  feedbackSelector: "#contact-feedback",
  endpoint: "/api/contact",
  onSuccess: (data, form, feedback) => {
    setFeedback(feedback, "success", data.message);
    form.reset();
  },
});

wireForm({
  formSelector: "#newsletter-form",
  feedbackSelector: "#newsletter-feedback",
  endpoint: "/api/newsletter",
  onSuccess: (data, form, feedback) => {
    setFeedback(feedback, "success", data.message);
    form.reset();
  },
});

loadHealth();
