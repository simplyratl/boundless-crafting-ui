const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface CombineResult {
  name: string;
  emoji: string;
  description: string;
  hasCompletedDaily: boolean;
  similarity: number | null;
}

export interface AskResult {
  answer: string;
}

export async function combineElements(
  first: string,
  second: string,
  dailyGoal: string | null = null
): Promise<CombineResult> {
  const payload: Record<string, unknown> = {
    first,
    second,
  };

  if (dailyGoal) {
    payload.dailyGoal = dailyGoal;
  }

  const response = await fetch(`${API_BASE_URL}/combine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(`Failed to combine elements${text ? `: ${text}` : ""}`);
  }

  return response.json();
}

export async function askQuestion(question: string): Promise<AskResult> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Failed to ask question");
  }

  return response.json();
}

export async function resetCache(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset-cache`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to reset cache");
  }
}

export async function resetDatabase(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset-db`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to reset database");
  }
}
