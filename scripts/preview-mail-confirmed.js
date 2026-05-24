const { execFileSync } = require('child_process');

const uri = 'palestra://auth/callback?preview=mail-confirmed';
const pkg = 'org.palestra.argentina';

console.log(`Abriendo preview de confirmacion: ${uri}`);
console.log('Requiere un Android con la app instalada y adb disponible.');

try {
  execFileSync(
    'adb',
    ['shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', uri, pkg],
    { stdio: 'inherit' }
  );
} catch (error) {
  console.log('\nNo pude ejecutar adb automaticamente.');
  console.log('Ejecuta manualmente este comando:');
  console.log(`adb shell am start -W -a android.intent.action.VIEW -d "${uri}" ${pkg}`);
}
