import os
import re
import mysql.connector
from mysql.connector import Error
from unidecode import unidecode
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

def gerarSlug(text):
  if not text:
    return ''

  text_without_accent = unidecode(text).lower()
  clean_text = re.sub(r'[^\w\s-]', '', text_without_accent)
  slug = re.sub(r'[-\s]+', '-', clean_text).strip('-_')

  return slug

def backfillSlug():
  print("✨ Starting script to fill slugs...")
  connection = None
  try:
    db_url = os.getenv("DATABASE_URL")  

    if not db_url:
      print("❌ Erro: A variável de ambiente DATABASE_URL não foi encontrada no .env")
      return

    db_user = "keystone"
    db_password = "ZWHb78t[XVu8fJ@u"
    db_host = "localhost"
    db_port = 3306
    db_name = "keystone"

    print(f"Tentando conectar ao banco '{db_name}' no host '{db_host}'...")
    print(f"senha: {db_password}")

    connection = mysql.connector.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database=db_name
    )
    print("✅ Conexão bem-sucedida!")

    cursor = connection.cursor(dictionary=True)

    query = "SELECT id, title FROM Podcast WHERE slug IS NULL AND title IS NOT NULL"
    cursor.execute(query)
    podcasts_to_update = cursor.fetchall()

    if not podcasts_to_update:
        print("✅ Nenhum podcast para atualizar. Tudo certo!")
        return

    print(f"🔍 Encontrados {len(podcasts_to_update)} podcasts para atualizar.")

    for podcast in podcasts_to_update:
        # ... (o resto da lógica é a mesma)
        base_slug = gerarSlug(podcast['title'])
        final_slug = base_slug
        counter = 2

        while True:
            cursor.execute("SELECT id FROM Podcast WHERE slug = %s", (final_slug,))
            if cursor.fetchone() is None:
                break
            final_slug = f"{base_slug}-{counter}"
            counter += 1

        print(f"🔄 Atualizando \"{podcast['title']}\" -> slug: \"{final_slug}\"")

        update_query = "UPDATE Podcast SET slug = %s WHERE id = %s"
        update_cursor = connection.cursor()
        update_cursor.execute(update_query, (final_slug, podcast['id']))
        update_cursor.close()

    connection.commit()
    print(f"💾 {len(podcasts_to_update)} registros foram atualizados com sucesso.")

  except Error as e:
      print(f"❌ Erro ao conectar ou operar no MySQL: {e}")
  finally:
      if connection and connection.is_connected():
          cursor.close()
          connection.close()
          print("🔌 Conexão com o MySQL foi fechada.")
            
  print("🎉 Script concluído!")

# --- Ponto de entrada do script ---
if __name__ == "__main__":
    backfillSlug()

