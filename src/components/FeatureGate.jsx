// src/components/FeatureGate.jsx

import { useFeatureAllowed } from "../context/UserStatusContext";

export default function FeatureGate({
  feature,
  fallback = null,
  children,
}) {
  const allowed = useFeatureAllowed(feature);

  if (!allowed) {
    return fallback;
  }

  return children;
}
