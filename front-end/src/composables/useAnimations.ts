import gsap from "gsap";
import { motionTokens } from "@/theme/colors";

export type MotionEasing = keyof typeof motionTokens.easing;
export type MotionDuration = keyof typeof motionTokens.duration;

export interface TransitionConfig {
  duration?: MotionDuration;
  easing?: MotionEasing;
}

const getDuration = (key: MotionDuration = "base") => motionTokens.duration[key];
const getEasing = (key: MotionEasing = "easeOut") => motionTokens.easing[key];

export const useAnimations = () => {
  const fadeIn = (el: gsap.TweenTarget, config: TransitionConfig = {}) => {
    return gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: getDuration(config.duration),
        ease: getEasing(config.easing),
      }
    );
  };

  const fadeOut = (el: gsap.TweenTarget, config: TransitionConfig = {}) => {
    return gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: getDuration(config.duration),
      ease: getEasing(config.easing),
    });
  };

  const slideIn = (el: gsap.TweenTarget, config: TransitionConfig = {}) => {
    return gsap.fromTo(
      el,
      { opacity: 0, x: 24 },
      {
        opacity: 1,
        x: 0,
        duration: getDuration(config.duration),
        ease: getEasing(config.easing),
      }
    );
  };

  const scaleIn = (el: gsap.TweenTarget, config: TransitionConfig = {}) => {
    return gsap.fromTo(
      el,
      { opacity: 0, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        duration: getDuration(config.duration),
        ease: getEasing(config.easing),
      }
    );
  };

  const hoverLift = (el: gsap.TweenTarget) => {
    gsap.to(el, {
      y: -2,
      duration: getDuration("fast"),
      ease: getEasing("easeOut"),
    });
  };

  const hoverReset = (el: gsap.TweenTarget) => {
    gsap.to(el, {
      y: 0,
      duration: getDuration("fast"),
      ease: getEasing("easeOut"),
    });
  };

  return {
    fadeIn,
    fadeOut,
    slideIn,
    scaleIn,
    hoverLift,
    hoverReset,
  };
};
