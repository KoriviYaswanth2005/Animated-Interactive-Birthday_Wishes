
/* Developer profile interactions — safe to load on both pages */
(() => {
  const initDeveloper = () => {
    const section = document.querySelector(".site-developer");
    if (!section || section.dataset.sdReady === "true") return;
    section.dataset.sdReady = "true";

    const card = section.querySelector(".sd-card");
    const copyButton = section.querySelector("#sdCopyEmail");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        const email = "yaswanthinfotech@gmail.com";
        try {
          if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
          await navigator.clipboard.writeText(email);
          copyButton.innerHTML = '<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Email copied!';
        } catch (error) {
          window.prompt("Copy the developer email:", email);
          copyButton.innerHTML = '<i class="bi bi-copy" aria-hidden="true"></i> Copy email';
        }
        window.setTimeout(() => {
          copyButton.innerHTML = '<i class="bi bi-copy" aria-hidden="true"></i> Copy email';
        }, 2200);
      });
    }

    if ("IntersectionObserver" in window && !reduceMotion) {
      const revealItems = section.querySelectorAll(".sd-heading, .sd-card, .sd-signoff, .sd-project");
      revealItems.forEach((item, index) => {
        item.classList.add("sd-reveal");
        item.style.setProperty("--sd-delay", `${Math.min(index * 100, 300)}ms`);
      });
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sd-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealItems.forEach(item => revealObserver.observe(item));
    }

    if (card && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 2.5}deg) rotateY(${(x - 0.5) * 3}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeveloper, { once: true });
  } else {
    initDeveloper();
  }
})();
