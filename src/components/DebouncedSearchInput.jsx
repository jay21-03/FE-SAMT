import { useEffect, useRef, useState } from "react";

export default function DebouncedSearchInput({
  placeholder = "Search...",
  delay = 400,
  onChange,
}) {
  const [value, setValue] = useState("");
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof onChangeRef.current === "function") {
        onChangeRef.current(value);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <input
      className="search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

