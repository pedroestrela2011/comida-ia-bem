import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface SectionTransitionProps {
  children: React.ReactNode;
}

/**
 * Premium scroll-driven transition between Hero and the next section.
 * A luminous horizontal "wave" travels across the boundary between
 * sections as the user scrolls, with a subtle lift/blur on the first
 * child. No clip-path is used so the next section never leaves a blank
 * gap below the Hero.
 */
const SectionTransition = ({ children }: SectionTransitionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Wave travels across the viewport as the user scrolls through Hero.
  const waveY = useTransform(scrollYProgress, [0, 0.9], ["-10vh", "110vh"]);
  const waveOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.75, 0.9],
    [0, 1, 1, 0]
  );

  // Subtle hero treatment — stays visible, just a soft lift + blur so
  // the next section can flow up against it without a blank area.
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const heroBlur = useTransform(scrollYProgress, [0.5, 1], [0, 4]);
  const heroFilter = useTransform(heroBlur, (b) => `blur(${b}px)`);

  const childArray = Array.isArray(children) ? children : [children];
  const [first, ...rest] = childArray as React.ReactNode[];

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="relative">
      <motion.div
        style={{ y: heroY, filter: heroFilter, willChange: "transform, filter" }}
      >
        {first}
      </motion.div>

      {rest}

      {/* Luminous wave */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-[5] h-[120px] md:h-[160px]"
        style={{ top: 0, y: waveY, opacity: waveOpacity, willChange: "transform, opacity" }}
      >
        <div className="relative w-full h-full">
          <div
            className="absolute inset-0 blur-2xl opacity-70"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.35) 45%, hsl(var(--accent) / 0.35) 55%, transparent 100%)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SectionTransition;
