import { MentalProcess, useActions, useProcessMemory } from "@opensouls/engine";

const entryDelimiter = "\n---\n";
const maxEntries = 20;

const matchesPlanOrGoal = (content: string): boolean => {
  return (
    content.includes("GOLEM DAILY PLAN") ||
    content.includes("GOLEM CHECK-IN") ||
    content.includes("GOLEM HABIT PLAN") ||
    content.includes("Goal habits:")
  );
};

const extractLatestEntry = (contents: Array<string | undefined>): string | null => {
  for (let index = contents.length - 1; index >= 0; index -= 1) {
    const content = contents[index];
    if (typeof content === "string" && matchesPlanOrGoal(content)) {
      return content;
    }
  }

  return null;
};

const appendEntry = (current: string, entry: string): string => {
  const entries = current ? current.split(entryDelimiter) : [];

  if (entries.includes(entry)) {
    return current;
  }

  entries.push(entry);
  const trimmed = entries.slice(-maxEntries);
  return trimmed.join(entryDelimiter);
};

const commitPlansAndGoals: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions();
  const planLog = useProcessMemory("Plan and Goal Log");

  const contents = workingMemory.memories.map((memory) => memory.content);
  const latestEntry = extractLatestEntry(contents);

  if (!latestEntry) {
    return workingMemory;
  }

  const currentLog = typeof planLog.current === "string" ? planLog.current : "";
  const updatedLog = appendEntry(currentLog, latestEntry);

  if (updatedLog !== currentLog) {
    planLog.current = updatedLog;
    log("Committed plan/goal to long-term memory.");
  }

  return workingMemory;
};

export default commitPlansAndGoals;
