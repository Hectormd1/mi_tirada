/* eslint-disable */
const { exec, execSync } = require("child_process");
const readline = require("readline");

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function waitForAdbDevice({ desiredAvdName = "Samsung23plus", maxMs = 120000, pollMs = 2000 }) {
  const start = Date.now();

  // Asegura que ADB corre
  try {
    sh("adb start-server");
  } catch (e) {
    console.warn("Warning: adb start-server falló, continuando...", e.message);
  }

  let serial = null;

  while (Date.now() - start < maxMs) {
    // Lista dispositivos
    let out;
    try {
      out = sh("adb devices -l");
    } catch (e) {
      out = "";
    }

    // Busca líneas tipo: emulator-5554 device product:sdk_gphone32_x86_64 ...
    const lines = out.split(/\r?\n/).slice(1); // skip header
    for (const line of lines) {
      if (!line.trim()) continue;
      // Campos: <serial>\s+<state>\s+...
      const parts = line.trim().split(/\s+/);
      const candidateSerial = parts[0];
      const state = parts[1];

      // Intento: filtrar por emulator serial (empieza por emulator-)
      if (candidateSerial.startsWith("emulator-")) {
        // Si está en device listo, lo usamos
        if (state === "device") {
          serial = candidateSerial;
          break;
        }
        // Si está offline aún, esperamos
      }
    }

    if (serial) break;
    process.stdout.write(".");
    await sleep(pollMs);
  }

  if (!serial) {
    throw new Error("Tiempo agotado esperando a que ADB vea el emulador en estado 'device'.");
  }

  console.log(`\nEmulador detectado: ${serial}. Esperando boot completo...`);

  // Espera sys.boot_completed
  while (Date.now() - start < maxMs) {
    try {
      const boot = sh(`adb -s ${serial} shell getprop sys.boot_completed`);
      const devBoot = sh(`adb -s ${serial} shell getprop dev.bootcomplete`);
      if (boot === "1" && devBoot === "1") {
        // Verifica Package Manager
        try {
          const pm = sh(`adb -s ${serial} shell pm path android`);
          if (pm && pm.includes("package:")) {
            console.log("Sistema Android operativo.");
            return serial;
          }
        } catch {
          // pm no listo aún, seguimos
        }
      }
    } catch {
      // dispositivo desapareció? seguimos intentando
    }
    process.stdout.write("+");
    await sleep(pollMs);
  }

  throw new Error("Tiempo agotado esperando a que Android complete el arranque.");
}

async function main() {
  console.log("Esperando a que el emulador esté listo (ADB + boot completo)...");
  let serial;
  try {
    serial = await waitForAdbDevice({ desiredAvdName: "Samsung23plus" });
  } catch (err) {
    console.error("No se pudo detectar el emulador a tiempo:", err.message);
    process.exit(1);
  }

  console.log(`Lanzando app en ${serial}...`);
  // Usa --deviceId para asegurar el destino correcto
  const cmd = `npx react-native run-android --deviceId ${serial}`;
  const child = exec(cmd, { stdio: "inherit" });

  child.stdout?.on("data", d => process.stdout.write(d));
  child.stderr?.on("data", d => process.stderr.write(d));

  child.on("exit", code => {
    if (code === 0) {
      console.log("Instalación completada.");
    } else {
      console.error(`run-android salió con código ${code}.`);
    }
    // Importante: NO salgas del proceso si quieres que concurrently lo mantenga;
    // pero aquí sí terminamos porque este script ya no tiene nada más que hacer.
    // OJO: NO uses process.exit() duro; deja que termine natural para evitar matar otros.
  });
}

main();
