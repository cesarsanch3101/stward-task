"use client";

import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: api.getAllUsers,
    staleTime: 5 * 60 * 1000, // 5 min — users don't change often
  });
}
