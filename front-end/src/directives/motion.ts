import { useAnimations } from "@/composables/useAnimations";

declare global {
  interface HTMLElement {
    __onMouseEnter?: (ev?: MouseEvent) => void;
    __onMouseLeave?: (ev?: MouseEvent) => void;
    __onMouseDown?: (ev?: MouseEvent) => void;
    __tween?: any;
  }
}

export const vHoverLift = {
  beforeMount(el: HTMLElement) {
    const { hoverLift, hoverReset } = useAnimations();
    el.__onMouseEnter = () => hoverLift(el);
    el.__onMouseLeave = () => hoverReset(el);
    el.addEventListener("mouseenter", el.__onMouseEnter as EventListener);
    el.addEventListener("mouseleave", el.__onMouseLeave as EventListener);
  },
  unmounted(el: HTMLElement) {
    el.removeEventListener("mouseenter", el.__onMouseEnter as EventListener);
    el.removeEventListener("mouseleave", el.__onMouseLeave as EventListener);
  },
};

export const vTapScale = {
  beforeMount(el: HTMLElement) {
    const { scaleIn } = useAnimations();
    el.__onMouseDown = () => {
      if (el.__tween) el.__tween.kill();
      el.__tween = scaleIn(el, { duration: 0.12 });
    };
    el.addEventListener("mousedown", el.__onMouseDown as EventListener);
  },
  unmounted(el: HTMLElement) {
    el.removeEventListener("mousedown", el.__onMouseDown as EventListener);
  },
};
