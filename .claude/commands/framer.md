Add Framer Motion animations to a React component or page.

Target: $ARGUMENTS

Install if needed: `npm install framer-motion`

Implement these patterns as appropriate:

**Basic animations:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>
```

**Scroll-triggered:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true, margin: "-100px" }}
/>
```

**Staggered children:**
```tsx
<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants} />
  ))}
</motion.ul>
```

**Gestures:**
- whileHover, whileTap, whileDrag
- useDragControls for custom drag handles

**Layout animations:**
- layout prop for automatic FLIP animations
- <AnimatePresence> for exit animations
- layoutId for shared element transitions

**Advanced:**
- useScroll + useTransform for parallax
- useMotionValue + useSpring for physics
- AnimatePresence mode="wait" for page transitions

Apply the most impactful animations without over-animating. Respect prefers-reduced-motion.
