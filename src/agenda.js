import { TMongo } from "./infra/mongoClient.js";
import { lib } from "./utils/lib.js";
import nodeSchedule from "node-schedule";
import { anuncioController } from "./controller/anuncioController.js";
global.processandoNow = 0;

async function task() {
  global.processandoNow = 1;

  //limitar horario de trabalho
  if ((await lib.isManutencao()) == 1) {
    console.log("Serviço em manutenção" + +lib.currentDateTimeStr());
    return;
  }

  //inicializar automaticamente
  await anuncioController.init();

  console.log(" Fim do processamento rotina task " + lib.currentDateTimeStr());
}

async function init() {
  // anuncioController.init();
  // return;

  try {
    let time = process.env.CRON_JOB_TIME || 10; //tempo em minutos
    const job = nodeSchedule.scheduleJob(`*/${time} * * * *`, async () => {
      console.log(" Job start as " + lib.currentDateTimeStr());
      await TMongo.close();

      if (global.processandoNow == 1) {
        console.log(
          " Job can't started [processing] " + lib.currentDateTimeStr()
        );
        return;
      }

      try {
        await task();
      } finally {
        global.processandoNow = 0;
      }
    });
  } catch (error) {
    throw new Error(`Can't start agenda! Err: ${error.message}`);
  }
}

export const agenda = { init };
