import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export function SplashScreen({ onFinish, duration = 3000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (!isVisible) {
      // Dá um tempo para a animação terminar antes de chamar onFinish
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [isVisible, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 z-50"
        >
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mb-8"
            >
              <motion.div
                animate={{
                  rotateZ: [0, 10, 0, -10, 0],
                  scale: [1, 1.05, 1, 1.05, 1]
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1],
                  repeat: Infinity,
                }}
                className="relative"
              >
                <img
                  src="/valecashback-logo.svg"
                  alt="Vale Cashback"
                  className="h-40 w-40"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                Vale Cashback
              </h1>
              <p className="text-blue-100 text-sm">
                Seu programa completo de cashback e fidelidade
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 1 }}
              className="w-48 bg-white/20 h-1 rounded-full overflow-hidden mt-2"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                  repeatType: "loop",
                }}
                className="h-full bg-orange-400 w-1/2 rounded-full"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-6"
            >
              <div className="flex space-x-3">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.5 + index * 0.15,
                      type: "spring"
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: index * 0.4,
                        }}
                        className="h-2 w-2 bg-white rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{
                  x: Math.random() * 100 - 50 + "%",
                  y: -20,
                  scale: Math.random() * 0.6 + 0.2,
                  opacity: 0
                }}
                animate={{
                  y: "120%",
                  x: `${Math.random() * 100}%`,
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: Math.random() * 4 + 4,
                  delay: Math.random() * 3,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
                className="absolute w-6 h-6 rounded-full bg-white/10 backdrop-blur-md"
              />
            ))}
          </div>
          
          <div className="absolute bottom-8 text-blue-200 text-xs">
            © Vale Cashback {new Date().getFullYear()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}