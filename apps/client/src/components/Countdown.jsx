import { useEffect, useState } from "react";

export function Countdown({ deadline }) {
  const [seconds, setSeconds] = useState(getSeconds(deadline));

  useEffect(() => {
    setSeconds(getSeconds(deadline));
    if (!deadline) {
      return undefined;
    }

    const interval = setInterval(() => setSeconds(getSeconds(deadline)), 250);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) {
    return null;
  }

  return <div className="countdown" aria-label={`${seconds} seconds remaining`}>{seconds}</div>;
}

function getSeconds(deadline) {
  return deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;
}
