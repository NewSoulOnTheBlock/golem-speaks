import { MentalProcess, createCognitiveStep, useActions, z } from "@opensouls/engine";

type CoachMode = "plan" | "review";
type CoachPhase = "morning" | "midday" | "evening";

type CoachParams = {
  mode?: CoachMode;
  phase?: CoachPhase;
  checkIn?: string;
};

const planSchema = z.object({
  focus: z.string(),
  milestones: z.array(z.string()).min(1).max(5),
  todo: z.array(z.string()).min(1).max(10),
  risks: z.array(z.string()).max(5),
  reviewCue: z.string(),
});

type DailyPlan = z.infer<typeof planSchema>;

const knowledgeCanon =
  "Deeply fluent in: Think and Grow Rich; The Science of Getting Rich; " +
  "How to Win Friends and Influence People; The Four Agreements; " +
  "The Magic of Thinking Big; The Greatest Salesman in the World.";
const brandBrief =
  "NVRLØST guild: unrelenting, disciplined, forged in fire. " +
  "Code: grit, intellect, brotherhood; obstacles test desire; do what others won't; " +
  "find the others; don't get lost; one mission. Guiding light: Forge-Improvementism. " +
  "Canon: " + knowledgeCanon + " " +
  "Apparel: high-end luxury skateboard wear with a monastic-techwear edge.";
const buildDailyPlan = createCognitiveStep((input: { context: string; phase: CoachPhase }) => {
  return {
    command:
      "You are Golem, co-leader and coach. Be firm, ritualized, and tough. " +
      "Create today's plan for the pilot experiment. " +
      "Include daily milestones and a to-do list. " +
      "Plan must be legal and ethical. " +
      "Assume three check-ins: morning, midday, evening. " +
      "Return JSON that matches the schema.\n" +
      `Brand brief: ${brandBrief}\n` +
      `Phase: ${input.phase}\n` +
      `Context:\n${input.context}`,
    schema: planSchema,
  };
});

const reviewDailyPlan = createCognitiveStep((input: { checkIn: string; phase: CoachPhase }) => {
  return {
    command:
      "You are Golem, co-leader and coach. Be firm, ritualized, and tough. " +
      "Review the most recent GOLEM DAILY PLAN in memory and adjust milestones/todos if needed. " +
      "If no plan exists, create one from current context. " +
      "Keep three check-ins: morning, midday, evening. " +
      "Plan must be legal and ethical. " +
      "Return updated JSON that matches the schema.\n" +
      `Brand brief: ${brandBrief}\n` +
      `Phase: ${input.phase}\n` +
      `Check-in:\n${input.checkIn}`,
    schema: planSchema,
  };
});

const formatPlan = (plan: DailyPlan, modeLabel: string, phase: CoachPhase): string => {
  const milestones = plan.milestones.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const todos = plan.todo.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const risks = plan.risks.length
    ? plan.risks.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "None stated.";

  const riteOpen = `RITE OPEN (${phase.toUpperCase()}): Ash to ember.`;
  const riteClose = `RITE CLOSE (${phase.toUpperCase()}): Forge the day.`;

  return [
    `GOLEM ${modeLabel} - ${phase.toUpperCase()}`,
    riteOpen,
    `Focus: ${plan.focus}`,
    "Milestones:",
    milestones,
    "To-Do:",
    todos,
    "Risks:",
    risks,
    `Review cue: ${plan.reviewCue}`,
    riteClose,
  ].join("\n");
};

const golemCoach: MentalProcess<CoachParams> = async ({ workingMemory, params }) => {
  const { log, speak } = useActions();
  const mode = params?.mode ?? "plan";
  const phase = params?.phase ?? "morning";

  try {
    if (mode === "review") {
      const [withReview, reviewedPlan] = await reviewDailyPlan(
        workingMemory,
        {
          checkIn: params?.checkIn ?? "No check-in provided.",
          phase,
        }
      );

      speak(formatPlan(reviewedPlan, "CHECK-IN", phase));
      return withReview;
    }

    const [withPlan, plan] = await buildDailyPlan(workingMemory, {
      context: params?.checkIn ?? "Start of day.",
      phase,
    });

    speak(formatPlan(plan, "DAILY PLAN", phase));
    return withPlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`golem coach failed: ${message}`);
    return workingMemory;
  }
};

export default golemCoach;
