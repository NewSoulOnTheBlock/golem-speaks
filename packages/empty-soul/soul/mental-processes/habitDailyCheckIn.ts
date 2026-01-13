import { MentalProcess } from "@opensouls/engine";
import habitTrainer from "./habitTrainer";

type DailyParams = {
  day?: string;
  checkIn?: string;
};

const habitDailyCheckIn: MentalProcess<DailyParams> = async ({ workingMemory, params }) => {
  return [
    workingMemory,
    habitTrainer,
    {
      executeNow: true,
      day: params?.day,
      checkIn: params?.checkIn ?? "Set tomorrow's goals and habits based on today.",
    },
  ];
};

export default habitDailyCheckIn;
