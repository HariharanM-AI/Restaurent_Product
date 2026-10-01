"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { GuestActionCard } from "./action-card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { subscribeToActivity } from "@/lib/realtime/broadcast";
import { GuestActionData } from "@/types";

interface GuestActionListProps {
  actions: GuestActionData[];
  restaurantId: string;
  brandPrimaryColor?: string;
  onActionClick?: (action: GuestActionData) => void;
}

export function GuestActionList({
  actions,
  restaurantId,
  brandPrimaryColor,
  onActionClick,
}: GuestActionListProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Real-time synchronization when admin adds/edits/deletes actions
    const unsubscribe = subscribeToActivity(restaurantId, (event) => {
      if (
        event.eventType === "action_updated" ||
        event.eventType === "action_created" ||
        event.eventType === "action_deleted"
      ) {
        router.refresh();
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [restaurantId, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 380,
        damping: 26,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 px-4 py-2"
    >
      {actions.map((action) => (
        <motion.div key={action.id} variants={itemVariants}>
          <GuestActionCard
            action={action}
            restaurantId={restaurantId}
            brandPrimaryColor={brandPrimaryColor}
            onActionClick={onActionClick}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
