# Changelog

Mudanças deste serviço. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Entradas sob [Unreleased] são geradas pelo hook `post-commit` (release-notes do infinity-workspace).

## [Unreleased]

## [1.1.1] - 2026-11-26

### Fixed

- Corrigido o botão "Abrir no Infinity Remote" do chat, que não abria o programa
- Corrigiu o link do Conectar para o formato aceito pelo programa Infinity Remote
- O Infinity Remote passou a abrir apenas pela página do app, fora do login

## [1.1.0] - 2026-11-24

### Added

- App desktop abre com o computador na bandeja e avisa chamadas no Windows com Atender e Recusar
- Instalador de teste do desktop passou a abrir a homolog por endereço fixado no build
- Adicionado salvamento do arquivo convertido ao lado do original no app desktop, sem sobrescrever arquivos existentes

### Changed

- Desktop passou a abrir o próprio site com navegação restrita, sandbox e página sem conexão
- Anexo do chat passou a abrir em janela do app, já logada, em vez do navegador do sistema

### Fixed

- Links infinity:// passaram a levar a query string para a tela de destino
- Contenção de navegação limitada ao quadro principal, com modo login Microsoft para ADFS/MFA e sem o sufixo *.voxcity.com.br
- link infinity:// que abre o app fechado agora chega à tela e o link pendente só sai com o front carregado
- Link infinity:// pendente deixou de esperar iframe carregando e chega à tela com o app aberto
- Navegação cancelada pela casca não prende mais os deep links infinity:// seguintes
- Ações de atender e recusar chamada só valem com a ficha do aviso aberto, e a janela do anexo ficou sem ponte
- Corrigido aviso de chamada que fechava sem a ficha, link desconhecido que não trazia a janela e gravação na pasta de login

## [1.0.0] - 2026-02-19

### Added

- Primeira versão: o Infinity numa janela própria, com bandeja, notificações, auto-start e links infinity://
