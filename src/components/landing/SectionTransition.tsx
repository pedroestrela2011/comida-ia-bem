import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface SectionTransitionProps {
  children: React.ReactNode;
}

/**
 * Premium scroll-driven transition between Hero and the next section.
 * A luminous horizontal "wave" descends with scroll, fading/blurring the
 * first child (Hero) and revealing the second child via a vertical clip.
 *
 * Usage:
 *   <SectionTransition>
 *     <Hero />
 *     <ProblemSolution />
 *   </SectionTransition>
 */
const SectionTransition = ({ children }: SectionTransitionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Track scroll across the wrapper. Transition happens while the Hero
  // exits viewport and the next section comes in.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Wave runs from -10vh to 110vh (fully covers the screen once).
  const waveY = useTransform(scrollYProgress, [0, 0.5], ["-10vh", "110vh"]);
  const waveOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.45, 0.55],
    [0, 1, 1, 0]
  );

  // Hero exit: fade + lift + blur as the wave passes through it.
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.5], [0, 8]);
  const heroFilter = useTransform(heroBlur, (b) => `blur(${b}px)`);

  // Reveal mask for the next section (clipped from top as wave descends).
  const revealClip = useTransform(
    scrollYProgress,
    [0, 0.5],
    ["inset(100% 0 0 0)", "inset(0% 0 0 0)"]
  );

  const childArray = Array.isArray(children) ? children : [children];
  const [first, ...rest] = childArray as React.ReactNode[];

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="relative">
      {/* Hero with progressive exit */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY, filter: heroFilter, willChange: "transform, opacity, filter" }}
      >
        {first}
      </motion.div>

      {/* Next section revealed by descending clip */}
      <motion.div style={{ clipPath: revealClip, WebkitClipPath: revealClip as unknown as string }}>
        {rest}
      </motion.div>

      {/* Luminous wave */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-[5] h-[120px] md:h-[160px]"
        style={{ top: 0, y: waveY, opacity: waveOpacity, willChange: "transform, opacity" }}
      >
        <div className="relative w-full h-full">
          {/* Soft glow halo */}
          <div
            className="absolute inset-0 blur-2xl opacity-70"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.35) 45%, hsl(var(--accent) / 0.35) 55%, transparent 100%)",
            }}
          />
          {/* Crisp luminous line */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, hsl(var(--primary) / 0.9) 30%, hsl(var(--accent) / 0.9) 70%, transparent 100%)",
              boxShadow:
                "0 0 24px hsl(var(--primary) / 0.55), 0 0 64px hsl(var(--accent) / 0.35)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SectionTransition;
