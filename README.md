# mi_tirada
Configurar entorno, ejecutar en PowerShell como administrador los siguientes comandos:

#### Instalar node.js(v18+)
👉 https://nodejs.org

#### Instala Chocolatey (si no lo tienes):
Set-ExecutionPolicy Bypass -Scope Process -Force; `
[System.Net.ServicePointManager]::SecurityProtocol = `
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))


#### Instala JDK y Android Studio con chocolatey:
choco install -y openjdk17 androidstudio

#### Instala React Native CLI
npm install -g react-native-cli

#### Configurar Android Studio
#### Abre Android Studio → selecciona More Actions → SDK Manager

#### Asegúrate de marcar querer instalar:
Android SDK Platform (API 33 o superior)
Android SDK Command-line Tools
Android Emulator


#### Luego, crea un emulador Android (AVD) inicialo y cuando termine de cargar ya puedes cerrar Android Studio.
#### Agrega estas variables de entorno en tu sistema (Variables de entorno de Windows):

JAVA_HOME → C:\Program Files\Eclipse Adoptium\jdk-17.x.x (según lo instalado)
ANDROID_HOME → C:\Users\TU_USUARIO\AppData\Local\Android\Sdk

#### Agrega también a Path:

%ANDROID_HOME%\emulator
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
C:\Users\Hector\AppData\Local\Android\Sdk\platform-tools
C:\Users\Hector\AppData\Local\Android\Sdk\emulator
C:\Users\Hector\AppData\Local\Android\Sdk\platform-tools

#### Para crear proyecto:
npx @react-native-community/cli init MiTirada
cd MiTirada


#### Iniciar react-native:
npx react-native start

#### Arranca el emulador:
emulator -list-avds # Ver nombres de emuladores creados mediante android Studio
emulator -avd NOMBRE_DEL_AVD

#### En otra terminal, lanza la app al emulador
npx react-native run-android


#### Si hay problemas con las conexiones del emulador probar reiniciar servidor de adb:
adb kill-server
adb start-server
adb devices

adb kill-server
taskkill /IM qemu-system-x86_64.exe /F 2>$null
taskkill /IM emulator.exe /F 2>$null

#### Dispositivo físico Android
Activa la depuración USB en tu móvil Android.
Conéctalo por cable.
Luego:
adb devices                   # Verifica que aparece tu móvil
npx react-native run-android





# Extrae la DB interna al fichero local tiradas.db fuera de POWERSHEL en BASH por ejemplo
adb exec-out run-as com.mitirada cat databases/tiradas.db > tiradas.db

### Guardar cambios
# 1) Sube tu tiradas.db editada a /data/local/tmp
adb push tiradas.db /data/local/tmp/tiradas.db

# 2) Con run-as, copia desde ese tmp hacia la carpeta de tu app
adb shell run-as com.mitirada cp /data/local/tmp/tiradas.db databases/tiradas.db

# 3) (Opcional) borra el temporal
adb shell rm /data/local/tmp/tiradas.db