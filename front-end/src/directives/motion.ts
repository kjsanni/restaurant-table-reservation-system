import { useAnimations } from "@/composables/useAnimations";
import type { ElementDirective } from "vue";

export const vHoverLift: ElementDirective = {
  beforeMount(el) {
    const { hoverLift, hoverReset } = useAnimations();
    el.__onMouseEnter = () => hoverLift(el);
    el.__onMouseLeave = () => hoverReset(el);
    el.addEventListener("mouseenter", el.__onMouseEnter);
    el.addEventListener("mouseleave", el.__onMouseLeave);
  },
  unmounted(el) {
    el.removeEventListener("mouseenter", el.__onMouseEnter);
    el.removeEventListener("mouseleave", el.__onMouseLeave);
  },
};

export const vTapScale: ElementDirective = {
  beforeMount(el) {
    const { scaleIn } = useAnimations();
    el.__onMouseDown = () => {
      if (el.__tween) el.__tween.kill();
      el.__tween = scaleIn(el, { duration: "fast" });
    };
    el.addEventListener("mousedown", el.__onMouseDown);
  },
  unmounted(el) {
    el.removeEventListener("mousedown", el.__onMouseDown);
  },
};
