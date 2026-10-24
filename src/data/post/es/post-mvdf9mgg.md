---
title: "Windows 11 bloqueado al 100 por ciento en la actualización: Cómo vaciar la caché"
description: "Soluciona el bloqueo de Windows 11 al 100% en actualizaciones vaciando la carpeta SoftwareDistribution en nuestra oficina de Barcelona."
publishDate: 2026-10-18T14:45:00.000Z
image: "/images/tech-photo/tech-photo (32).jpg"
category: 'tech'
tags: ["Windows11", "SoporteIT", "ResoluciónDeFallos", "SysAdmin"]
theme: "Solarized Amber Warm"
---









Eran las 7:30 de la tarde en nuestra oficina tecnológica del distrito 22@ en Barcelona. Estábamos a menos de cuarenta y ocho horas de liberar una nueva versión crítica de nuestro software principal, y decidí reiniciar mi estación de trabajo tras aplicar el último parche acumulativo de Windows 11. Grave error. La pantalla se quedó congelada de forma impertinente en un fatídico "100% completado. No apague el equipo" durante más de una hora. El ventilador rugía como un reactor y el grupo de Slack echaba humo con compañeros preguntando por los binarios de la compilación previa al lanzamiento. Tenía la máquina principal totalmente secuestrada por el asistente de actualización.

<div style="border-left: 4px solid #d97706; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Nota de campo desde el estudio:</strong> Cuando el proceso de Windows Update se congela exactamente en el 100%, casi nunca se debe a que el sistema esté instalando código complejo. En el 95% de los casos, el servicio se ha quedado intentando registrar componentes o procesando archivos corruptos dentro del directorio de caché local sin poder avanzar ni dar marcha atrás.
</div>

![Tech & IT Solution Guide](https://picsum.photos/seed/computer579/1000/550)

## ¿Por qué se queda colgado Windows Update en el último segundo?

Tras rescatar el equipo mediante un reinicio forzoso y revisar los registros del Visor de eventos, el cuello de botella quedó clarísimo. Estos son los tres culpables habituales en entornos de desarrollo y producción:

1. Corrupción en la base de datos de actualización (Catroot2 y SoftwareDistribution): Archivos temporales de descarga que se han quedado a medias o con permisos bloqueados.

2. Servicios del sistema zombie: Los hilos de `wuauserv` (Windows Update) o `cryptsvc` (Cryptographic Services) se quedan colgados en bucle infinito intentando verificar firmas digitales que ya han expirado o fallado.

3. Interferencias de software de seguridad o políticas de red corporativas: Un corte breve de la VPN de la oficina justo cuando descargaba el último manifiesto binario.

## Pasos para la solución: Vaciado de la caché y reseteo de servicios

Para salir de este apuro sin tener que formatear ni perder la configuración de desarrollo, vamos a detener los servicios críticos de actualización mediante la Terminal y a vaciar manualmente la caché corrupta. Abre el menú Inicio, escribe Terminal(o Símbolo del sistema), haz clic derecho y seleccionaEjecutar como administrador.

### Paso 1: Detener los servicios de actualización
Copia y pega los siguientes comandos para apagar los procesos que están bloqueando los archivos:

```cmd
net stop wuauserv
net stop cryptSvc
net stop bits
net stop msiserver
```

### Paso 2: Renombrar las carpetas de caché
En lugar de borrar directamente el contenido (lo que a veces genera conflictos de permisos), lo más seguro es renombrar las carpetas clave para que Windows 11 cree unas nuevas y limpias automáticamente:

```cmd
ren C:\Windows\SoftwareDistribution SoftwareDistribution.bak
ren C:\Windows\System32\catroot2 catroot2.bak
```

### Paso 3: Reiniciar los servicios del sistema
Una vez purgada la caché corrupta, volvemos a poner en marcha los motores del sistema operativo:

```cmd
net start wuauserv
net start cryptSvc
net start bits
net start msiserver
```

<div style="border-left: 4px solid #d97706; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Consejo del experto:</strong> Si al intentar renombrar las carpetas el sistema te indica que están en uso, reinicia el equipo en Modo Seguro (Configuración > Sistema > Recuperación > Inicio avanzado) y ejecuta los comandos anteriores antes de que carguen los servicios en segundo plano.
</div>

## Recomendaciones de estabilidad y prevención

Para evitar que este susto se repita en mitad de un despliegue importante, te sugiero aplicar estas buenas prácticas en tu equipo de trabajo:

* Pausar actualizaciones en fechas clave: Si estás en pleno sprint o en la semana previa al lanzamiento de un producto, pausa las actualizaciones de Windows 11 desde la sección de Configuración hasta un máximo de cinco semanas.
* Mantenimiento preventivo de disco: Ejecuta periódicamente la herramienta Liberador de espacio en disco para eliminar archivos residuales de instalaciones anteriores de Windows.
* Verificación de integridad: Ante cualquier duda con archivos del sistema tras un cuelgue, corre siempre un comando rápido de `sfc /scannow` en tu terminal de administrador.

## Preguntas Frecuentes (FAQ)

¿Pierdo datos personales o aplicaciones instaladas al renombrar SoftwareDistribution? No. Esta carpeta almacena únicamente los paquetes temporales de instalación descargados desde los servidores de Microsoft. Tus documentos, programas y configuraciones de usuario permanecen completamente intactos.

¿Qué hago si el comando `net stop wuauserv` se queda en "El servicio se está deteniendo..." indefinidamente? Es un síntoma clásico de que un subproceso se ha quedado colgado en el Kernel. La solución más rápida es abrir el Administrador de tareas (Ctrl + Shift + Esc), buscar el proceso de Windows Update en la pestaña Detalles, hacer clic derecho y seleccionarFinalizar árbol de procesos.

¿Es seguro eliminar las carpetas `.bak` que hemos creado?
Sí, pero te recomiendo esperar un par de días y comprobar que tu sistema arranca, apaga y actualiza sin problemas antes de borrarlas definitivamente para liberar espacio en el disco C.
