import { MentalProcess } from "@opensouls/engine";
import golemCoach from "./golemCoach";

type RitualPhase = "morning" | "midday" | "evening";

type DispatcherParams = {
  phase?: RitualPhase;
  checkIn?: string;
};

const golemRitualDispatcher: MentalProcess<DispatcherParams> = async ({ workingMemory, params }) => {
  const phase = params?.phase ?? "morning";
  const mode = phase === "morning" ? "plan" : "review";

  return [
    workingMemory,
    golemCoach,
    {
      executeNow: true,
      mode,
      phase,
      checkIn: params?.checkIn,
    },
  ];
};

export default golemRitualDispatcher;
