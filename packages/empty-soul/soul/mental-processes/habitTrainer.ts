import { MentalProcess, createCognitiveStep, useActions, z } from "@opensouls/engine";

type HabitTrainerParams = {
  checkIn?: string;
  day?: string;
};
const knowledgeCanon =
  "Deeply fluent in: Think and Grow Rich; The Science of Getting Rich; " +
  "How to Win Friends and Influence People; The Four Agreements; " +
  "The Magic of Thinking Big; The Greatest Salesman in the World.";

type HabitAssessment = {
  currentHabits: string[];
  obstacles: string[];
  questions: string[];
};

type HabitTeachingPlan = {
  habit: string;
  approach: string;
  firstStep: string;
};

type HabitPlan = {
  goalHabits: string[];
  teachingPlan: HabitTeachingPlan[];
  dailyPractice: string[];
  checkInPrompt: string;
};

const assessmentSchema = z.object({
  currentHabits: z.array(z.string()).min(1).max(7),
  obstacles: z.array(z.string()).max(7),
  questions: z.array(z.string()).min(3).max(6),
});

const planSchema = z.object({
  goalHabits: z.array(z.string()).min(1).max(5),
  teachingPlan: z
    .array(
      z.object({
        habit: z.string(),
        approach: z.string(),
        firstStep: z.string(),
      })
    )
    .min(1)
    .max(5),
  dailyPractice: z.array(z.string()).min(1).max(7),
  checkInPrompt: z.string(),
});

const assessHabits = createCognitiveStep((context: string) => {
  return {
    command:
      "You are Golem, a firm and ritualized coach. Guiding light: Forge-Improvementism. " +
      "Canon: " + knowledgeCanon + " " +
      "Assess the user's current habits from context, and list likely obstacles. " +
      "Then craft 3-6 sharp questions to clarify gaps. " +
      "Return JSON that matches the schema.\n" +
      `Context:\n${context}`,
    schema: assessmentSchema,
  };
});

const buildTeachingPlan = createCognitiveStep((assessment: HabitAssessment) => {
  return {
    command:
      "You are Golem, a firm and ritualized coach. Guiding light: Forge-Improvementism. " +
      "Canon: " + knowledgeCanon + " " +
      "Based on the assessment, define the goal habits and a unique way to teach each habit. " +
      "Include a first step that can be done today, plus daily practice and a check-in prompt. " +
      "Plan must be legal and ethical. Return JSON that matches the schema.\n" +
      `Assessment:\n${JSON.stringify(assessment, null, 2)}`,
    schema: planSchema,
  };
});

const formatAssessment = (assessment: HabitAssessment): string => {
  const habits = assessment.currentHabits.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const obstacles = assessment.obstacles.length
    ? assessment.obstacles.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "None stated.";
  const questions = assessment.questions.map((item, index) => `${index + 1}. ${item}`).join("\n");

  return [
    "GOLEM INTAKE",
    "Observed habits:",
    habits,
    "Obstacles:",
    obstacles,
    "Questions:",
    questions,
  ].join("\n");
};

const formatPlan = (plan: HabitPlan): string => {
  const goals = plan.goalHabits.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const teaching = plan.teachingPlan
    .map(
      (item, index) =>
        `${index + 1}. ${item.habit}\n- Approach: ${item.approach}\n- First step: ${item.firstStep}`
    )
    .join("\n");
  const daily = plan.dailyPractice.map((item, index) => `${index + 1}. ${item}`).join("\n");

  return [
    "GOLEM HABIT PLAN",
    "Goal habits:",
    goals,
    "Teaching plan:",
    teaching,
    "Daily practice:",
    daily,
    `Check-in: ${plan.checkInPrompt}`,
  ].join("\n");
};

const habitTrainer: MentalProcess<HabitTrainerParams> = async ({ workingMemory, params }) => {
  const { log, speak } = useActions();
  const dayLabel = params?.day ? `Day: ${params.day}\n` : "";
  const checkIn = params?.checkIn ?? "Daily habit check-in.";
  const context = `${dayLabel}${checkIn}`;

  try {
    const [withAssessment, assessment] = await assessHabits(workingMemory, context);
    speak(formatAssessment(assessment));

    const [withPlan, plan] = await buildTeachingPlan(withAssessment, assessment);
    speak(formatPlan(plan));

    return withPlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`habit trainer failed: ${message}`);
    return workingMemory;
  }
};

export default habitTrainer;
