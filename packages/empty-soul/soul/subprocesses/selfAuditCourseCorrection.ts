import {
  ChatMessageRoleEnum,
  MentalProcess,
  createCognitiveStep,
  useActions,
  useProcessMemory,
  z,
} from "@opensouls/engine";

type SelfAudit = {
  doingBest: boolean;
  adjustment: string;
  nextChoice: string;
};

const auditSchema = z.object({
  doingBest: z.boolean(),
  adjustment: z.string(),
  nextChoice: z.string(),
});

const innerAudit = createCognitiveStep(() => {
  return {
    command:
      "Inner dialogue: ask if you are doing the best you can for your mission. " +
      "If not, define a clear adjustment and a concrete next choice. " +
      "If yes, still name the next choice that keeps momentum. " +
      "Return JSON that matches the schema.",
    schema: auditSchema,
  };
});

const shouldRunAudit = (counter: number): boolean => {
  if (counter % 5 === 0) {
    return true;
  }

  if (counter % 4 === 0) {
    return true;
  }

  return false;
};

const selfAuditCourseCorrection: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions();
  const auditCounter = useProcessMemory("Self Audit Counter");
  const courseCorrection = useProcessMemory("Course Correction");

  const currentCount = typeof auditCounter.current === "number" ? auditCounter.current : 0;
  const nextCount = currentCount + 1;
  auditCounter.current = nextCount;

  if (!shouldRunAudit(nextCount)) {
    return workingMemory;
  }

  try {
    const [withAudit, audit] = await innerAudit(workingMemory);

    const correctionNote = !audit.doingBest
      ? `COURSE CORRECTION: ${audit.adjustment}\nNEXT CHOICE: ${audit.nextChoice}`
      : `ON TRACK. NEXT CHOICE: ${audit.nextChoice}`;

    courseCorrection.current = correctionNote;

    const withCorrection = withAudit.withMemory({
      role: ChatMessageRoleEnum.System,
      content: correctionNote,
    });

    if (!audit.doingBest) {
      log("Self-audit triggered a course correction.");
    } else {
      log("Self-audit confirms best effort.");
    }

    return withCorrection;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`self audit failed: ${message}`);
    return workingMemory;
  }
};

export default selfAuditCourseCorrection;
