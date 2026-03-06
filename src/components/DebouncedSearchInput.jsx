import { useEffect, useState } from "react";

export default function DebouncedSearchInput({
  placeholder = "Search...",
  delay = 400,
  onChange,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof onChange === "function") {
        onChange(value);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, onChange]);

  return (
    <input
      className="search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

