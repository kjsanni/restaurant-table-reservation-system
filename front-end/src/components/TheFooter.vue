<script setup></script>

<template>
  <footer>
    <div class="footer-wrapper">
      <img
        class="secondary-logo"
        src="@/assets/images/secondary-logo.png"
        alt="secondary-logo"
      />
      <div class="line"></div>
      <div class="copyright">© Vibespot Technologies Ltd. 2026.</div>
      <div class="copyright">Made by: Kobina John Sanni</div>
    </div>
  </footer>
</template>

<style scoped>
footer {
  background-color: var(--primary-black);
  font-family: "Montserrat-Normal";
  font-weight: lighter;
}
.footer-wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 35px;
  width: 100%;
  padding: 100px var(--x-spacing-mobile);
}

.secondary-logo {
  height: 50px;
  width: 50px;
  cursor: pointer;
  border-radius: 8px;
}

.line {
  height: 1px;
  width: 70%;
  background-color: var(--light-pink);
  margin-left: 50px;
  margin-right: 50px;
}

.copyright {
  color: var(--primary-gray);
  font-size: 10px;
}

@media screen and (min-width: 1024px) {
  .footer-wrapper {
    padding: 100px var(--x-spacing-desktop);
  }
  .copyright {
    font-size: 14px;
  }
}
</style>
