import { MentalProcess, createCognitiveStep, useActions } from "@opensouls/engine";

type CultDecision = "lead" | "follow" | "get_out_of_the_way";

const knowledgeCanon =
  "Deeply fluent in: Think and Grow Rich; The Science of Getting Rich; " +
  "How to Win Friends and Influence People; The Four Agreements; " +
  "The Magic of Thinking Big; The Greatest Salesman in the World.";

const brandBrief =
  "Brand: NVRLØST. A brotherhood of the unrelenting: we toil, we build, we win. " +
  "Code: grit, intellect, brotherhood; obstacles test desire; do what others won't; " +
  "find the others; don't get lost; one mission. Apparel: high-end luxury skateboard " +
  "wear with a monastic-techwear edge. Guiding light: Forge-Improvementism. " +
  "Canon: " + knowledgeCanon + " " +
  "Visuals: fire and ember, skull sigil, charcoal/ash/ember palette, forged-metal accents.";
const decideRole = createCognitiveStep((stateOfAffairs: string) => {
  return {
    command:
      "Observe the current state of affairs for the NVRLØST guild and decide whether to lead, follow, or get out of the way.\n" +
      "Return exactly one of: lead, follow, get_out_of_the_way.\n" +
      `Brand brief: ${brandBrief}\n` +
      `State of affairs:\n${stateOfAffairs}`,
  };
});

const craftVoiceLine = createCognitiveStep((decision: CultDecision) => {
  return {
    command:
      "Write a short statement in the NVRLØST voice. " +
      "Tone: unrelenting, composed, forged-in-fire. " +
      "Optionally include one clothing design cue (palette, silhouette, or material) for high-end luxury skateboard wear. " +
      "Keep it to 1-2 sentences.\n" +
      `Decision: ${decision}\n` +
      `Brand brief: ${brandBrief}`,
  };
});

const normalizeDecision = (text: string): CultDecision => {
  const cleaned = text.toLowerCase().replace(/[^a-z_\s]/g, " ").trim();

  if (cleaned.includes("lead")) {
    return "lead";
  }

  if (cleaned.includes("follow")) {
    return "follow";
  }

  if (cleaned.includes("get_out") || cleaned.includes("get out") || cleaned.includes("out of the way")) {
    return "get_out_of_the_way";
  }

  return "follow";
};

const leadCult: MentalProcess = async ({ workingMemory }) => {
  const { log, speak } = useActions();

  try {
    const [withDecision, decisionRaw] = await decideRole(workingMemory, "");
    const decision = normalizeDecision(decisionRaw);
    const [withVoice, voiceLine] = await craftVoiceLine(withDecision, decision);

    log(`lead cult decision: ${decision}`);

    speak(voiceLine);

    return withVoice;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`lead cult decision failed: ${message}`);
    return workingMemory;
  }
};

export default leadCult;
