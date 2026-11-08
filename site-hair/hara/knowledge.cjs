// Conteúdo público revisado em 08/11/2026. Não é uma base de alunos.
const base = 'https://www.hairacademiadabeleza.com.br';
const contact = 'https://wa.me/5516992558810?text=Ol%C3%A1%2C%20quero%20informa%C3%A7%C3%B5es%20sobre%20os%20cursos%20da%20HAIR.';
const topics = [
  {id:'horarios', terms:/horario|turma|domingo|segunda|terca|quarta|quinta|sexta|sabado|noturno|manha|noite|inici|data|vaga|preco|valor|quanto|mensal|matricula|desconto|parcela/, text:'Horários, datas de início, vagas e valores precisam de confirmação pela equipe HAIR. Agende também o atendimento presencial pelo WhatsApp oficial: (16) 99255-8810. Não consigo confirmar disponibilidade ou matrícula por este chat.', path:'/llms.txt'},
  {id:'local',terms:/onde|endereco|localiza|trio|visita|presencial/, text:'O atendimento presencial da HAIR ocorre somente com hora marcada no Trio Office: Av. Presidente Vargas, 1265, 16º andar, Jardim São Luiz, Ribeirão Preto/SP. As aulas acontecem nas academias parceiras; confirme a unidade da sua turma com a equipe.', path:'/llms.txt'},
  {id:'parceiros',terms:/academia|parceir|allan|lan\b|kenny|wolf|gustavo|rosatti|wesley|sharper|cesar|voz/, text:'O site publicado apresenta LAN Barbershop Academy (Allan Rich), Kenny Wolf Academy, Rosattí Barbearia (Gustavo Rosattí) e Studio Sharper Academy (Wesley Sharper). Para confirmar novas unidades, endereço da aula e turma disponível, fale com a equipe HAIR.', path:'/business'},
  {id:'cursos',terms:/curso|barbear|cabeleir|beauty|sobrancelha|cilio|cabelo|formacao|aprender/, text:'A HAIR oferece formação em barbearia e na área Beauty: cabelo, design de sobrancelhas e cílios. As páginas oficiais apresentam os educadores e a metodologia prática. A equipe comercial confirma o curso, a academia e a turma adequados para você.', path:'/beauty'},
  {id:'aluno',terms:/aluno|login|senha|nota|presenca|certificado|administr|sessao|token/,text:'Este é o atendimento público da HARA. Não consulto notas, presença, pagamentos ou dados de alunos. Para sua área pessoal, use o Conexão Hair pelo acesso de aluno do site. Para suporte de acesso, fale com a equipe oficial.',path:'/business/apps'},
  {id:'contato',terms:/contato|whats|telefone|comercial|humano|atendente/,text:'O WhatsApp oficial da HAIR Academia é (16) 99255-8810. O botão abaixo abre uma mensagem genérica; sua conversa aqui não é anexada. Você revisa e envia a mensagem no WhatsApp.',path:'/llms.txt'},
];
function answer(message) {
  const normalized=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const matches=topics.filter(t=>t.terms.test(normalized)).slice(0,3);
  return {reply:matches.length?matches.map(t=>t.text).join('\n\n'):'Posso ajudar com cursos, academias parceiras, localização e contato. Não tenho informação verificada para responder a essa pergunta. A equipe HAIR pode confirmar pelo WhatsApp oficial.', sources:[...new Set(matches.map(t=>base+t.path))], whatsapp:contact};
}
module.exports={answer,contact};
