'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Shield, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Floating particle component for visual effects
const FloatingParticle = ({
  side,
  index,
  isHovered
}: {
  side: 'iris' | 'aegis';
  index: number;
  isHovered: boolean;
}) => {
  const isIris = side === 'iris';
  const baseDelay = index * 0.5;
  const size = Math.random() * 4 + 2;

  return (
    <motion.div
      className={`absolute rounded-full ${
        isIris
          ? 'bg-gradient-to-br from-fuchsia-400/40 to-purple-500/40'
          : 'bg-gradient-to-br from-cyan-400/40 to-emerald-500/40'
      }`}
      style={{
        width: size,
        height: size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, Math.random() * 20 - 10, 0],
        opacity: isHovered ? [0.3, 0.8, 0.3] : [0.1, 0.4, 0.1],
        scale: isHovered ? [1, 1.5, 1] : [1, 1.2, 1],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: baseDelay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Grid line component for Aegis side
const GridLine = ({
  orientation,
  position,
  isHovered
}: {
  orientation: 'horizontal' | 'vertical';
  position: number;
  isHovered: boolean;
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <motion.div
      className={`absolute bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent ${
        isHorizontal ? 'h-px w-full' : 'w-px h-full'
      }`}
      style={isHorizontal ? { top: `${position}%` } : { left: `${position}%` }}
      animate={{
        opacity: isHovered ? [0.1, 0.4, 0.1] : [0.05, 0.15, 0.05],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: position * 0.02,
      }}
    />
  );
};

// Neural link orb in the center
const NeuralLinkOrb = ({
  leftHovered,
  rightHovered
}: {
  leftHovered: boolean;
  rightHovered: boolean;
}) => {
  const isAnyHovered = leftHovered || rightHovered;

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      {/* Outer glow rings */}
      <motion.div
        className="absolute -inset-16 rounded-full"
        style={{
          background: `radial-gradient(circle, ${
            leftHovered
              ? 'rgba(217, 70, 239, 0.15)'
              : rightHovered
                ? 'rgba(6, 182, 212, 0.15)'
                : 'rgba(139, 92, 246, 0.1)'
          } 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: isAnyHovered ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Neural connection lines */}
      <svg
        className="absolute -inset-24 w-48 h-48"
        viewBox="0 0 200 200"
      >
        {/* Left connection (Iris) */}
        <motion.path
          d="M 20 100 Q 60 100 100 100"
          stroke="url(#irisGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            pathLength: leftHovered ? [0, 1] : [0.3, 0.7, 0.3],
            opacity: leftHovered ? 1 : 0.5,
          }}
          transition={{
            duration: leftHovered ? 0.5 : 2,
            repeat: leftHovered ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Right connection (Aegis) */}
        <motion.path
          d="M 180 100 Q 140 100 100 100"
          stroke="url(#aegisGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            pathLength: rightHovered ? [0, 1] : [0.3, 0.7, 0.3],
            opacity: rightHovered ? 1 : 0.5,
          }}
          transition={{
            duration: rightHovered ? 0.5 : 2,
            repeat: rightHovered ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />

        <defs>
          <linearGradient id="irisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="aegisGradient" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Central orb */}
      <motion.div
        className="relative w-16 h-16"
        animate={{
          scale: isAnyHovered ? [1, 1.15, 1] : [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Orb background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${
              leftHovered
                ? '#d946ef, #a855f7'
                : rightHovered
                  ? '#06b6d4, #10b981'
                  : '#8b5cf6, #6366f1'
            })`,
            boxShadow: `0 0 40px ${
              leftHovered
                ? 'rgba(217, 70, 239, 0.6)'
                : rightHovered
                  ? 'rgba(6, 182, 212, 0.6)'
                  : 'rgba(139, 92, 246, 0.4)'
            }`,
          }}
          animate={{
            boxShadow: isAnyHovered
              ? [
                  `0 0 40px ${leftHovered ? 'rgba(217, 70, 239, 0.6)' : 'rgba(6, 182, 212, 0.6)'}`,
                  `0 0 60px ${leftHovered ? 'rgba(217, 70, 239, 0.8)' : 'rgba(6, 182, 212, 0.8)'}`,
                  `0 0 40px ${leftHovered ? 'rgba(217, 70, 239, 0.6)' : 'rgba(6, 182, 212, 0.6)'}`,
                ]
              : [
                  '0 0 30px rgba(139, 92, 246, 0.3)',
                  '0 0 50px rgba(139, 92, 246, 0.5)',
                  '0 0 30px rgba(139, 92, 246, 0.3)',
                ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Orb inner glow */}
        <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm" />

        {/* Orb icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: leftHovered
              ? 'rgba(217, 70, 239, 0.3)'
              : rightHovered
                ? 'rgba(6, 182, 212, 0.3)'
                : 'rgba(139, 92, 246, 0.2)',
          }}
          animate={{
            scale: [1, 2.5, 3],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default function SplitGateLanding() {
  const router = useRouter();
  const [hoveredSide, setHoveredSide] = useState<'iris' | 'aegis' | null>(null);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Generate particles once
  const particles = useMemo(() => ({
    iris: Array.from({ length: 20 }, (_, i) => i),
    aegis: Array.from({ length: 20 }, (_, i) => i),
  }), []);

  // Generate grid lines for Aegis
  const gridLines = useMemo(() => ({
    horizontal: [10, 20, 30, 40, 50, 60, 70, 80, 90],
    vertical: [10, 20, 30, 40, 50, 60, 70, 80, 90],
  }), []);

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-dark-950">
      {/* Iris Side (Left) */}
      <motion.div
        className="relative h-full cursor-pointer overflow-hidden"
        initial={{ width: '50%' }}
        animate={{
          width: hoveredSide === 'iris' ? '60%' : hoveredSide === 'aegis' ? '40%' : '50%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        onMouseEnter={() => setHoveredSide('iris')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => handleNavigate('/iris')}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a1d6e 50%, #2d1b4e 75%, #1a0a2e 100%)',
            backgroundSize: '400% 400%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Organic flowing overlay */}
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(217, 70, 239, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
          }}
          animate={{
            opacity: hoveredSide === 'iris' ? 0.6 : 0.4,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.iris.map((i) => (
            <FloatingParticle
              key={`iris-${i}`}
              side="iris"
              index={i}
              isHovered={hoveredSide === 'iris'}
            />
          ))}
        </div>

        {/* Dimming overlay when other side is hovered */}
        <AnimatePresence>
          {hoveredSide === 'aegis' && (
            <motion.div
              className="absolute inset-0 bg-black/40 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-8">
          {/* Glassmorphism card */}
          <motion.div
            className="relative p-12 rounded-3xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(217, 70, 239, 0.2)',
              boxShadow: '0 8px 32px rgba(217, 70, 239, 0.15), inset 0 0 32px rgba(217, 70, 239, 0.05)',
            }}
            whileHover={{
              boxShadow: '0 16px 64px rgba(217, 70, 239, 0.3), inset 0 0 48px rgba(217, 70, 239, 0.1)',
              border: '1px solid rgba(217, 70, 239, 0.4)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <motion.div
              className="flex justify-center mb-8"
              animate={{
                scale: hoveredSide === 'iris' ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: hoveredSide === 'iris' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <div
                className="relative p-6 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  boxShadow: '0 0 40px rgba(217, 70, 239, 0.4)',
                }}
              >
                <Eye className="w-16 h-16 text-fuchsia-300" strokeWidth={1.5} />

                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(217, 70, 239, 0.4) 0%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl font-bold text-center mb-4 tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #f0abfc 0%, #d946ef 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(217, 70, 239, 0.5)',
              }}
            >
              IRIS
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-fuchsia-200/80 text-center font-light tracking-wide"
              animate={{
                opacity: hoveredSide === 'iris' ? 1 : 0.7,
              }}
            >
              Visualize & Dream
            </motion.p>

            {/* Decorative line */}
            <motion.div
              className="mt-8 h-px mx-auto"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.5), transparent)',
              }}
              animate={{
                width: hoveredSide === 'iris' ? 200 : 150,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Description on hover */}
            <AnimatePresence>
              {hoveredSide === 'iris' && (
                <motion.p
                  className="mt-6 text-sm text-fuchsia-200/60 text-center max-w-xs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  The creative AI companion that transforms your vision into stunning visual concepts and experiences
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Click hint */}
          <motion.p
            className="absolute bottom-12 text-fuchsia-300/50 text-sm"
            animate={{
              opacity: hoveredSide === 'iris' ? [0.5, 1, 0.5] : 0.3,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            Click to enter
          </motion.p>
        </div>
      </motion.div>

      {/* Aegis Side (Right) */}
      <motion.div
        className="relative h-full cursor-pointer overflow-hidden"
        initial={{ width: '50%' }}
        animate={{
          width: hoveredSide === 'aegis' ? '60%' : hoveredSide === 'iris' ? '40%' : '50%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        onMouseEnter={() => setHoveredSide('aegis')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => handleNavigate('/aegis')}
      >
        {/* Tech gradient background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #021a1a 0%, #0a2f2f 25%, #0d4444 50%, #0a2f2f 75%, #021a1a 100%)',
            backgroundSize: '400% 400%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Grid lines overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {gridLines.horizontal.map((pos) => (
            <GridLine
              key={`h-${pos}`}
              orientation="horizontal"
              position={pos}
              isHovered={hoveredSide === 'aegis'}
            />
          ))}
          {gridLines.vertical.map((pos) => (
            <GridLine
              key={`v-${pos}`}
              orientation="vertical"
              position={pos}
              isHovered={hoveredSide === 'aegis'}
            />
          ))}
        </div>

        {/* Cyber glow overlay */}
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(6, 182, 212, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(16, 185, 129, 0.25) 0%, transparent 50%)',
          }}
          animate={{
            opacity: hoveredSide === 'aegis' ? 0.6 : 0.4,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Matrix-style floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.aegis.map((i) => (
            <FloatingParticle
              key={`aegis-${i}`}
              side="aegis"
              index={i}
              isHovered={hoveredSide === 'aegis'}
            />
          ))}
        </div>

        {/* Data stream effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`stream-${i}`}
              className="absolute w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
              style={{
                left: `${12 + i * 12}%`,
                height: '30%',
              }}
              animate={{
                top: ['-30%', '130%'],
                opacity: hoveredSide === 'aegis' ? [0, 0.6, 0] : [0, 0.3, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        {/* Dimming overlay when other side is hovered */}
        <AnimatePresence>
          {hoveredSide === 'iris' && (
            <motion.div
              className="absolute inset-0 bg-black/40 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-8">
          {/* Terminal-style card */}
          <motion.div
            className="relative p-12 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15), inset 0 0 32px rgba(6, 182, 212, 0.05)',
            }}
            whileHover={{
              boxShadow: '0 16px 64px rgba(6, 182, 212, 0.3), inset 0 0 48px rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Terminal header decoration */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <div className="w-3 h-3 rounded-full bg-cyan-500/30" />
            </div>

            {/* Icon */}
            <motion.div
              className="flex justify-center mb-8"
              animate={{
                scale: hoveredSide === 'aegis' ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: hoveredSide === 'aegis' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <div
                className="relative p-6 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                  clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)',
                }}
              >
                <Shield className="w-16 h-16 text-cyan-300" strokeWidth={1.5} />

                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl font-bold text-center mb-4 tracking-wider font-mono"
              style={{
                background: 'linear-gradient(135deg, #67e8f9 0%, #06b6d4 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(6, 182, 212, 0.5)',
              }}
            >
              AEGIS
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-cyan-200/80 text-center font-light tracking-wide font-mono"
              animate={{
                opacity: hoveredSide === 'aegis' ? 1 : 0.7,
              }}
            >
              Execute & Build
            </motion.p>

            {/* Decorative line */}
            <motion.div
              className="mt-8 h-px mx-auto"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent)',
              }}
              animate={{
                width: hoveredSide === 'aegis' ? 200 : 150,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Description on hover */}
            <AnimatePresence>
              {hoveredSide === 'aegis' && (
                <motion.p
                  className="mt-6 text-sm text-cyan-200/60 text-center max-w-xs font-mono"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  The tactical AI engineer that transforms concepts into production-ready code and systems
                </motion.p>
              )}
            </AnimatePresence>

            {/* Blinking cursor effect */}
            <motion.div
              className="absolute bottom-4 right-4 flex items-center gap-1 text-cyan-400/50 text-xs font-mono"
              animate={{
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <Zap className="w-3 h-3" />
              <span>READY</span>
            </motion.div>
          </motion.div>

          {/* Click hint */}
          <motion.p
            className="absolute bottom-12 text-cyan-300/50 text-sm font-mono"
            animate={{
              opacity: hoveredSide === 'aegis' ? [0.5, 1, 0.5] : 0.3,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {'>'} Click to initialize
          </motion.p>
        </div>
      </motion.div>

      {/* Center Neural Link */}
      <NeuralLinkOrb
        leftHovered={hoveredSide === 'iris'}
        rightHovered={hoveredSide === 'aegis'}
      />

      {/* Center divider line */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-40"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.3) 20%, rgba(139, 92, 246, 0.5) 50%, rgba(139, 92, 246, 0.3) 80%, transparent 100%)',
        }}
        animate={{
          opacity: hoveredSide ? 0.3 : 0.6,
        }}
      />

      {/* Top center branding */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="text-center">
          <h2
            className="text-sm font-medium tracking-[0.3em] uppercase"
            style={{
              background: 'linear-gradient(90deg, #d946ef, #8b5cf6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Choose Your Path
          </h2>
        </div>
      </motion.div>

      {/* Bottom center info */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <p className="text-xs text-dark-400 tracking-wider">
          VIBE CODE PLATFORM v1.0
        </p>
      </motion.div>
    </div>
  );
}
