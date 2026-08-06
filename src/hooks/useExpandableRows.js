import { useState } from "react";

export default function useExpandableRows() {
  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));
  return { expandedId, toggle };
}
