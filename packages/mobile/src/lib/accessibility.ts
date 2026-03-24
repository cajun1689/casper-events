import { AccessibilityInfo, Platform } from "react-native";
import { useEffect, useState } from "react";

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  return reduceMotion;
}

export function useScreenReader(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setActive);
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setActive,
    );
    return () => sub.remove();
  }, []);

  return active;
}

export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

export function accessibilityProps(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}
