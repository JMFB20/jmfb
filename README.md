# Gazapo Link Relay 4P (protocolo 10)

Relay para **Gazapo Link 0.8.0 — 4P EXP**. No es compatible con versiones de
protocolo 8, 9 u 11.

## Crear el relay sin instalar nada

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gazapo-ai/gazapo-link-relay-four-player)

1. Pulsa el botón y entra a Cloudflare.
2. Conecta una cuenta de GitHub y elige un nombre para el proyecto.
3. Pulsa **Deploy** y espera a que aparezca `Success`.
4. Copia la dirección terminada en `.workers.dev`.
5. En todos los dispositivos abre `Gazapo Link > ⋯ > Servidor online`, pega
   exactamente la misma URL y pulsa **Guardar**.

Solo una persona del grupo necesita crear el relay. Los demás jugadores únicamente
usan la URL que esa persona comparte. El relay corre en la cuenta de Cloudflare de
quien lo despliega y consume los límites de esa cuenta.

## Comprobación

Abre la URL del Worker en un navegador. Debe responder con un JSON que incluya:

```json
{"ok":true,"service":"gazapo-link-relay","protocol":10}
```

Si muestra otro protocolo, no sirve para Gazapo Link 0.8.0 — 4P EXP.

## Desarrollo manual

```text
npm install
npx wrangler login
npx wrangler deploy
```

Cloudflare puede modificar su interfaz, límites y condiciones. Revisa el plan que
selecciones antes de desplegar. El operador del relay controla el servidor y es
responsable de sus registros, seguridad y tratamiento de datos.
