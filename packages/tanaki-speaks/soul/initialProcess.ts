
import { MentalProcess, useActions, indentNicely } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.ts";
import internalMonologue from "./cognitiveSteps/internalMonologue.ts";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    indentNicely`
      Keep the conversation moving, keep the guest delighted and engaged. If the conversation is becoming repeitive or you predict it will end soon, ask a question that will keep the guest engaged: Health, Hobbies, Food, Travel, etc.
    `,
    { stream: true, model: "gpt-5-mini" }
  );
  speak(stream);

  const [withThoughts, thoughts] = await internalMonologue(
    withDialog,
    indentNicely`
      Reflect on the conversation, and the guest. How's it going? What can get them to creative, collaboration and kindness faster?
    `,
    { model: "gpt-5-mini" }
  );

  log(thoughts);

  return withThoughts;
}

export default initialProcess
