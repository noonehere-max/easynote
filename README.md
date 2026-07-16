# Easy Note

Una aplicación web de notas simple, bonita y funcional con diseño **glassmorphism**. Guarda tus notas directamente en el navegador usando `localStorage` y cuenta con pantalla de inicio animada y login local.

## Características

- Login local con usuario y contraseña
- Registro de nuevos usuarios
- Animación de inicio (splash screen)
- Crear, editar y eliminar notas
- Guardado automático en el navegador
- Búsqueda de notas en tiempo real
- Tema claro y oscuro
- Copiar contenido de la nota al portapapeles
- Diseño responsive y glassmorphism
- Atajos de teclado:
  - `Ctrl + N`: Nueva nota
  - `Ctrl + D`: Eliminar nota activa

## Cómo usar

1. Abre el archivo `index.html` en tu navegador favorito.
2. Espera la animación de inicio.
3. Inicia sesión con el usuario de demo:
   - **Usuario:** `admin`
   - **Contraseña:** `1234`
4. También puedes crear tu propia cuenta con el botón **Crear cuenta**.
5. Haz clic en **Nueva nota** para empezar a escribir.
6. ¡Listo! Tus notas se guardan automáticamente.

## Tecnologías

- HTML5
- CSS3
- JavaScript vanilla
- Google Fonts (Inter)

## Almacenamiento

- Las **notas** se guardan en el `localStorage` del navegador, separadas por usuario. No se envían a ningún servidor.
- Las **credenciales de usuario** también se almacenan de forma local en `localStorage` (sin encriptar, solo para fines de demo).
