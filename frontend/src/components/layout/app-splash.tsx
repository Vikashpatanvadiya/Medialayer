import { motion } from "framer-motion";

/** Brand-consistent hold screen — used while auth state resolves on mobile. */
export function AppSplash() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background">
      <motion.img
        src="/favicon.svg"
        alt="MediaLayer"
        className="size-9"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="mt-6 h-0.5 w-16 overflow-hidden rounded-full bg-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <motion.div
          className="h-full w-1/2 rounded-full bg-primary"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
