import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";

interface NearMissOverlayProps {
  show: boolean;
  onClose: () => void;
}

export function NearMissOverlay({ show, onClose }: NearMissOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Gold particle burst */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-gold"
                initial={{
                  left: "50%",
                  top: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  left: `${50 + (Math.cos((i / 40) * Math.PI * 2) * 60)}%`,
                  top: `${50 + (Math.sin((i / 40) * Math.PI * 2) * 60)}%`,
                  scale: [0, 1.4, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.8, delay: i * 0.015, ease: "easeOut" }}
                style={{ boxShadow: "0 0 12px hsl(var(--gold))" }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative max-w-md mx-4 p-8 rounded-3xl glass-strong border-2 border-gold neon-border text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-gradient-gold mb-4 glow-gold"
            >
              <Shield className="w-8 h-8 text-gold-foreground" />
            </motion.div>

            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="font-imperial font-black text-3xl text-gradient-gold mb-2 break-keep"
            >
              제국이 위기에서<br />살아남았다!
            </motion.h2>

            <p className="text-sm text-muted-foreground mb-1 break-keep">
              한 칸 차이로 <span className="text-destructive font-bold">JACKPOT</span>을 비껴갔습니다
            </p>
            <p className="text-[11px] text-gold mb-5 break-keep flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Recovery 보너스 +50% 활성화
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-gold text-gold-foreground font-imperial font-black text-base hover:scale-[1.02] transition-transform glow-gold"
            >
              다시 도전 → 잭팟 정복
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
