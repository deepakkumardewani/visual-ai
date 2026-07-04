<script setup lang="ts">
const year = new Date().getFullYear();

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Gallery", to: "/gallery" },
      { label: "Examples", to: "/examples" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQ", to: "/faqs" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Refund", to: "/refund" },
    ],
  },
] as const;
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <router-link to="/" class="footer__wordmark">Visual<span>AI</span></router-link>
        <p class="footer__tagline">
          One studio to generate, upscale, colorize, and revive images — powered by the FLUX models.
        </p>
      </div>

      <nav class="footer__cols" aria-label="Footer">
        <div v-for="col in columns" :key="col.heading" class="footer__col">
          <h3 class="footer__heading">{{ col.heading }}</h3>
          <ul>
            <li v-for="link in col.links" :key="link.to">
              <router-link :to="link.to" class="footer__link">{{ link.label }}</router-link>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <div class="footer__bar">
      <p>© {{ year }} Visual AI. All rights reserved.</p>
      <p class="footer__made">Crafted for image-makers.</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 5rem) 1.5rem 2.5rem;
  border-top: 1px solid #2d2319;
}

.footer__inner {
  display: grid;
  gap: 2.5rem;

  @media (min-width: 820px) {
    grid-template-columns: 1.4fr 1fr;
  }
}

.footer__wordmark {
  font-family: "Young Serif", Georgia, serif;
  font-size: 1.5rem;
  color: #f0e8dc;
  text-decoration: none;

  span {
    color: #c98a5a;
    margin-left: 0.15em;
  }
}
.footer__tagline {
  margin: 1rem 0 0;
  max-width: 24rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #6b5e51;
}

.footer__cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.footer__heading {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a89888;
  margin: 0 0 1rem;
}
.footer__col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.footer__link {
  font-size: 0.95rem;
  color: #f0e8dc;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #c98a5a;
  }
}

.footer__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  justify-content: space-between;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  padding-top: 1.75rem;
  border-top: 1px solid #2d2319;
  font-size: 0.85rem;
  color: #6b5e51;

  p {
    margin: 0;
  }
}
</style>
