import React, { createRef, useLayoutEffect } from "react";

import { useTheme } from "@/hooks";

const attributes = {
  src: "https://giscus.app/client.js",
  "data-repo": "eunsonny/eunsonny.github.io",
  "data-repo-id": "R_kgDOJdbv1A",
  "data-category": "Announcements",
  "data-category-id": "DIC_kwDOJdbv1M4CdnX2",
  "data-mapping": "title",
  "data-strict": "0",
  "data-reactions-enabled": "1",
  "data-emit-metadata": "0",
  "data-input-position": "bottom",
  "data-theme": "preferred_color_scheme",
  "data-lang": "en",
  crossorigin: "anonymous",
  async: "true",
};

function Comments() {
  const [{ mode }] = useTheme();
  const containerRef = createRef<HTMLDivElement>();

  useLayoutEffect(() => {
    const giscus = document.createElement("script");

    attributes["data-theme"] = mode;

    Object.entries(attributes).forEach(([key, value]) => {
      giscus.setAttribute(key, value);
    });

    if (containerRef.current) {
      containerRef.current.appendChild(giscus);
    }

    return () => {
      giscus.remove();
    };
  }, [containerRef]);

  return <div ref={containerRef} />;
}

export default Comments;
