/**
 * Converte uma string de texto em um "slug" amigável para URLs.
 * @param texto A string de entrada para converter.
 * @returns O slug formatado.
 */
export function generateSlug(texto: string): string {
  if (!texto) {
    return "";
  }

  // Mapa de caracteres acentuados para suas versões sem acento
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return (
    texto
      .toString()
      // 1. Converte tudo para minúsculas
      .toLowerCase()

      // 2. Substitui caracteres acentuados
      .replace(p, (c) => b.charAt(a.indexOf(c)))

      // 3. Substitui espaços por hífens
      .replace(/\s+/g, "-")

      // 4. Substitui o caractere '&' por '-and-'
      .replace(/&/g, "-and-")

      // 5. Remove todos os caracteres que não são letras, números ou hífens
      .replace(/[^\w\-]+/g, "")

      // 6. Remove hífens duplicados
      .replace(/\-\-+/g, "-")

      // 7. Remove hífens do início do texto
      .replace(/^-+/, "")

      // 8. Remove hífens do final do texto
      .replace(/-+$/, "")
  );
}
