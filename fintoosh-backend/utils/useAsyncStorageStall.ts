import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export interface StallItem {
  name: string;
  quantity: number;
  buyCost: number;
  sellPrice: number;
}

export interface StallState {
  level: number;
  funds: number;
  week: number;
  profit: number;
  inventory: StallItem[];
  unlockedItems: string[];
  lastMilestone: number;
}

const STALL_STATE_KEY = "entrepreneursStallStateV1";

const INITIAL_STATE: StallState = {
  level: 1,
  funds: 100,
  inventory: [{ name: "Lemonade Glass", quantity: 0, buyCost: 5, sellPrice: 8 }],
  unlockedItems: ["Lemonade Glass"],
  week: 1,
  profit: 0,
  lastMilestone: 0,
};

type StallStateResult =
  | { loading: true; error?: undefined; stall: undefined; setStall: (v: StallState) => void }
  | { loading: false; error?: string; stall: StallState; setStall: (v: StallState) => void };

export function useAsyncStorageStall(): StallStateResult {
  const [stall, setStall] = useState<StallState | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STALL_STATE_KEY);
        if (!isMounted) return;
        if (data) {
          setStall(JSON.parse(data));
        } else {
          setStall({ ...INITIAL_STATE });
        }
      } catch (err) {
        setStall({ ...INITIAL_STATE });
        setError("Failed to load stall state. Showing default stall.");
      }
      if (isMounted) setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist changes
  useEffect(() => {
    if (stall) {
      AsyncStorage.setItem(STALL_STATE_KEY, JSON.stringify(stall)).catch(() => {
        setError("Failed to save stall state.");
      });
    }
  }, [stall]);

  if (loading) {
    return { loading: true, stall: undefined, setStall };
  }
  if (!stall) {
    return { loading: false, error: "Missing stall state", stall: INITIAL_STATE, setStall };
  }
  return { loading: false, error, stall, setStall };
}

export { INITIAL_STATE, STALL_STATE_KEY };

