🦈 SharkStudy - O Seu Acervo Digital Inteligente
📌 Sobre o Projeto
O SharkStudy é uma aplicação web completa desenvolvida para gerir, armazenar e ler materiais de estudo (PDFs) de forma organizada. Nascido da necessidade de ter um ambiente focado e sem distrações para os estudos, o projeto evoluiu para um sistema robusto com autenticação, armazenamento em nuvem e uma interface de usuário altamente responsiva e intuitiva.

Este projeto foi construído para demonstrar as minhas habilidades como Front-end Developer, lidando não apenas com a construção de interfaces modernas, mas também com a integração complexa de Backend-as-a-Service (BaaS), gestão de estado e deploy contínuo.

🚀 Tecnologias Utilizadas
Front-end: React.js, Vite, Tailwind CSS, Lucide React (Ícones).

Back-end & Banco de Dados: Supabase (PostgreSQL).

Armazenamento: Supabase Storage (Buckets para PDFs).

Autenticação: Supabase Auth (E-mail e Senha).

Deploy: Vercel & GitHub.

✨ Funcionalidades Implementadas
Gestão de Sessão & Autenticação: Sistema de login e registro seguro.

Upload de Materiais: Envio de PDFs diretamente para o Storage com vinculação de metadados (Título, Autor, Categoria, Dificuldade) no banco de dados relacional.

Leitor de PDF Integrado: Leitura dos arquivos diretamente na plataforma, sem necessidade de downloads ou troca de abas.

Filtros Dinâmicos: Pesquisa em tempo real por título, autor, matéria e nível de dificuldade.

Persistência Inteligente (Lembrete de Usuário): Utilização de localStorage para lembrar o nome do último usuário logado, oferecendo uma experiência de "aplicativo nativo" mesmo quando deslogado.

UI/UX Responsiva: Sidebar expansível, modais interativos e feedback visual (loading states, tratamentos de erro).

🧠 A Jornada de Desenvolvimento: Desafios e Soluções
Durante o desenvolvimento do SharkStudy, enfrentei diversos desafios técnicos que me forçaram a sair da zona de conforto apenas do Front-end e mergulhar em arquitetura de dados e infraestrutura.

Aqui estão os principais aprendizados e como os resolvi:

1. Segurança e Row Level Security (RLS) no Supabase
O Problema: Inicialmente, os uploads dos PDFs e a criação dos perfis retornavam erros 400 Bad Request ou falhas silenciosas. O Supabase, por padrão, bloqueia qualquer escrita ou leitura externa.

A Solução: Aprendi a configurar políticas de RLS (Row Level Security) utilizando comandos SQL diretamente no banco de dados. Configurei regras específicas:

O Bucket de pdfs permite Insert apenas para usuários autenticados (auth.role() = 'authenticated'), mas Select (leitura) público.

A tabela books garante que o uploader_id seja obrigatoriamente o id do usuário logado (auth.uid() = uploader_id).

Resolvi conflitos de constraint (ex: difficulty_level_check) ajustando o esquema do banco de dados para a realidade da aplicação em português.

2. O Desafio do Upload e Tratamento de Arquivos
O Problema: Nomes de arquivos com espaços ou acentos quebravam a API do Storage. Além disso, se o arquivo subisse mas a inserção no banco falhasse, eu teria arquivos "fantasmas" ocupando espaço.

A Solução: Implementei uma lógica de Sanitização de Arquivos no Front-end (UploadModal.jsx). Antes do upload, o código extrai a extensão e gera um nome limpo e único usando Date.now() e um hash aleatório. O fluxo foi estruturado em etapas: Upload no Storage -> Resgatar URL Pública -> Salvar na Tabela books. Se um falhar, o erro é capturado no catch e o usuário é notificado.

3. Persistência de Estado e UX (O "Modo Lembrete")
A Ideia: Notei que, ao fazer Logout, a interface ficava impessoal (voltando para "Estudante Shark"). Eu queria a sensação de um computador pessoal.

A Solução: Implementei o localStorage atrelado ao useEffect principal. Quando um usuário faz login, o sistema busca o perfil no banco e salva o nome no navegador. Ao sair, o sistema revoga o acesso ao banco, mas a UI continua a dizer "Olá, [Nome]" baseada no cache local. O estado foi cuidadosamente gerido para que, se uma outra pessoa logar, o sistema sobrescreva o cache antigo automaticamente.

4. Deploy, Subpastas e Vercel
O Problema: Durante o deploy na Vercel, enfrentei repetidos erros ENOENT (Command "npm install" exited with 254).

A Solução: Diagnostiquei que o problema era estrutural no repositório. O código estava dentro de uma subpasta (sharkstudy) no GitHub, mas a Vercel estava procurando o package.json na raiz. Ajustei o Root Directory nas configurações da Vercel e aprendi a forçar a sincronização de commits via terminal (git push origin main --force) para alinhar o repositório local com a nuvem após reestruturações.

5. Sincronia de Cache da API (Erro 406 Not Acceptable)
O Problema: Ao buscar perfis ou alterar o esquema do banco, a API PostgREST do Supabase retornava erros informando que a coluna não existia, mesmo ela estando lá.

A Solução: Descobri como funciona o cache de esquema da API. Utilizei o SQL Editor para rodar o comando NOTIFY pgrst, 'reload schema', sincronizando as alterações do banco de dados com a API consumida pelo React, além de remover o uso de .single() em buscas que poderiam retornar vazias para novos cadastros.
