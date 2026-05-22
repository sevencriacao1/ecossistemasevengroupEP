import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

let scheduledRefresh = 0;

export function scheduleScrollTriggerRefresh() {
  if (scheduledRefresh) return;

  scheduledRefresh = window.requestAnimationFrame(() => {
    scheduledRefresh = 0;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger, useGSAP };
