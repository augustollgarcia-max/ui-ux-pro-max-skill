# Métricas diárias HAIR

Ramo só de dados (não é o site). A rotina agendada roda 1x por dia e:
1. puxa nota/avaliações do Google (place_id ChIJ1ZOBpc6_uZQR9rrSsxE0WMw) e o Instagram @hairacademiaoficial via Apify;
2. acrescenta uma linha em `hair-diario.csv`;
3. marca em `avaliacoes-vistas.json` os reviewId já vistos (para detectar avaliação nova);
4. se a nota do Google mudar, atualiza o "4,9" do site (PR + testes);
5. se entrar avaliação 5★ nova com texto, abre PR com o depoimento sugerido — publicar só com "pode publicar" do Augusto.
