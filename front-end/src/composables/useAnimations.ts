import gsap from "gsap";

const isReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useAnimations = () => {
  const enter = (el: GSAPTweenTarget, done: () => void) => {
    if (isReducedMotion()) {
      done();
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", onComplete: done }
    );
  };

  const leave = (el: GSAPTweenTarget, done: () => void) => {
    if (isReducedMotion()) {
      done();
      return;
    }
    gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: done,
    });
  };

  const fadeIn = (target: GSAPTweenTarget, duration = 0.3) => {
    if (isReducedMotion()) return undefined;
    return gsap.to(target, { opacity: 1, duration, ease: "power2.out" });
  };

  const slideIn = (
    target: GSAPTweenTarget,
    direction = "up",
    distance = 16,
    duration = 0.3
  ) => {
    if (isReducedMotion()) return;
    const y =
      direction === "up" ? distance : direction === "down" ? -distance : 0;
    const x =
      direction === "left" ? distance : direction === "right" ? -distance : 0;
    gsap.fromTo(
      target,
      { opacity: 0, y, x },
      { opacity: 1, x: 0, y: 0, duration, ease: "power2.out" }
    );
  };

  const staggerList = (selector: GSAPTweenTarget, stagger = 0.06) => {
    if (isReducedMotion()) return;
    gsap.fromTo(
      selector,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.25, stagger, ease: "power2.out" }
    );
  };

  const scaleIn = (
    target: GSAPTweenTarget,
    opts: { duration?: number } = {}
  ) => {
    if (isReducedMotion()) return;
    const duration = typeof opts?.duration === "number" ? opts.duration : 0.12;
    gsap.to(target, {
      scale: 0.95,
      duration,
      ease: "power2.out",
      yoyo: true,
      overwrite: true,
    });
  };

  const hoverLift = (target: GSAPTweenTarget, distance = 4) => {
    if (isReducedMotion()) return;
    gsap.to(target, { y: -distance, duration: 0.2, ease: "power2.out" });
  };

  const hoverReset = (target: GSAPTweenTarget) => {
    if (isReducedMotion()) return;
    gsap.to(target, { y: 0, duration: 0.2, ease: "power2.out" });
  };

  return {
    enter,
    leave,
    fadeIn,
    slideIn,
    staggerList,
    scaleIn,
    hoverLift,
    hoverReset,
  };
};
