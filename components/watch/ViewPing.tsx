"use client";

import { useEffect, useRef } from "react";
import { pingView } from "@/app/(shell)/watch/actions";

export default function ViewPing({ postId }: { postId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void pingView(postId);
  }, [postId]);
  return null;
}
