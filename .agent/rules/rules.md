---
trigger: always_on
---

No puede haber emojis en el codigo que generes.

Los archivos no pueden tener mas de 400 lineas.

Cualquier ícono que se deseé mostrar en pantalla tendrá que ser hecho obligatoriamente con LucideReact, nunca con emojis.

Todos los props creados para un componente tienen que estar creador con la palabra clave type y debe llamarse "Props" siempre.

Los props van a estar siempre en el mismo archivo del componete.

Los componentes siempre tienen que ser declarados de la siguiente manera:
```ts
export default function Component({ parámetro1, parámetro2,..., parámetroN }: Props){

    return (
  );
}
```

Evita el uso de any siempre que sea posible.

Todas las clases de las reglas de estilos en los archivos css deben empezar por un prefijo unico por componente, por ejemplo si mi archivo css se llama PrincipalPage.module.css entonces todos las clases creadas en ese archivo deben empezar por el prefijo .pg

Todos los imports de de css deben hacerse de la siguiente manera:
```ts
import "./ruta/ruta/archivo.module.css";
```

Todos los estilos deben ser responsive para pantallas pequeñas

El html nunca podrá definir estilos, todos deben ser importados de la carpeta styles.

Siempre que quieras agregar algo nuevo deberas revisar si ya existe y su funcionamiento sirve para lo que necesites hacer, si ya existe usalo, caso contrario crealo.

Todos los comentarios del codigo deben estar en español.

Cualquier Readme que hagas para explicar un cambio hecho debe ser corto y solo con lo mas importante, evitar hacer muchos Readme

Aplica patrones de diseño si es posible y recomendado segun el caso, no lo fuerces

Aplica los principios SOLID de ser posible

Los types son la capa de dominio del sistema y lo que definen se debe seguir en todo el sistema, para cambiar algo en el type siempre debes pedir permiso y solo hacerlo si yo digo que lo hagas

Despues de terminar de hacer un cambio vas a tener que hacer obligariamente un npm run build y luego npm test para comprobar que todo esté en orden, resulve cualquier problema que ocurra

Siempre que uses el MCP de supabase vas a tener que pedirme permiso y decirme que piensas hacer con el MCP