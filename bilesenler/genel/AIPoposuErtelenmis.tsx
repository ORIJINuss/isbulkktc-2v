"use client";

import { useEffect, useState } from "react";

export default function AIPoposuErtelenmis() {
  const [AIPoposu, setAIPoposu] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let etkin = true;

    const yukle = () => {
      import("@/bilesenler/genel/AIPoposu").then(({ default: Bilesen }) => {
        if (etkin) setAIPoposu(() => Bilesen);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(yukle, { timeout: 1800 });
      return () => {
        etkin = false;
        window.cancelIdleCallback(idleId);
      };
    }

    const zamanlayici: ReturnType<typeof setTimeout> = setTimeout(yukle, 900);
    return () => {
      etkin = false;
      clearTimeout(zamanlayici);
    };
  }, []);

  return AIPoposu ? <AIPoposu /> : null;
}
