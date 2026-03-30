"use client";

import { useEffect } from "react";
import api from "@/lib/api";

export default function ThemeProvider() {
  useEffect(() => {
    api.get("/stores/me").then((res) => {
      const color: string = res.data?.primaryColor || "#D4AF37";
      document.documentElement.style.setProperty("--accent", color);
    }).catch(() => {});
  }, []);

  return null;
}
