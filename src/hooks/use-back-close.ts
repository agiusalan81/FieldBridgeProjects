import { useEffect, useRef } from "react";

/** While `open`, the phone's Back button/gesture closes this panel instead of leaving the page. */
export function useBackClose(open: boolean, onClose: () => void) {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    window.history.pushState({ ...window.history.state, fbOverlay: true }, "");
    let popped = false;
    const onPop = () => { popped = true; cb.current(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!popped && window.history.state?.fbOverlay) window.history.back();
    };
  }, [open]);
}
