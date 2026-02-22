# 🚗⛽ FuelRank

[![Node.js](https://img.shields.io/badge/Node.js-Backend-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)

Plataforma colaborativa para comparação de preços de combustíveis, avaliações verificadas de postos e registro inteligente de abastecimentos.

## 📌 Sobre o Projeto

O FuelRank é um ecossistema (web e aplicativo mobile) focado em trazer transparência e segurança para quem abastece. O grande diferencial da plataforma é o seu sistema de verificação: **apenas usuários com comprovante válido podem avaliar ou denunciar um posto**, o que inibe avaliações falsas e garante a confiabilidade das informações para toda a comunidade.

Com o FuelRank, os usuários podem:
* Consultar preços atualizados de combustíveis na região.
* Encontrar postos próximos via geolocalização.
* Avaliar postos mediante comprovação obrigatória.
* Registrar e analisar o próprio histórico de abastecimentos e consumo.
* Denunciar combustíveis adulterados ou práticas abusivas.
* Construir reputação e, futuramente, receber recompensas e cashback.

## 🎯 O Problema

* **Falta de transparência:** Dificuldade em comparar preços reais entre postos próximos.
* **Avaliações não confiáveis:** Plataformas tradicionais sofrem com reviews falsos ou comprados.
* **Falta de canal de denúncia:** Inexistência de um sistema rápido e confiável para relatar combustível adulterado ou fraudes volumétricas nas bombas.
* **Desorganização:** Ausência de um histórico pessoal organizado para controle de gastos e média de consumo dos veículos.

## 💡 A Solução

O FuelRank resolve esses problemas unindo ferramentas tecnológicas modernas:
* **Geolocalização:** Mapeamento inteligente de postos.
* **Sistema de Reputação:** Gamificação baseada em informações reais.
* **Validação de Comprovantes:** Upload e análise de arquivos (NFC-e, NFe, PDF, print de banco).
* **OCR:** Leitura automática e extração de dados (como CNPJ e data) dos comprovantes.

---

## 🚀 Funcionalidades

### 📍 Geolocalização e Busca
* Encontre postos próximos via GPS (Mapa e Lista).
* Filtre por: Menor preço, Melhor avaliação, Promoções ativas ou Tipo de combustível.

### 💰 Comparação de Preços
* Cobertura para Gasolina (Comum/Aditivada), Etanol, Diesel e GNV.
* Gráfico de histórico de variação de preços.
* Indicação visual da data da última atualização.

### 🧾 Avaliação com Comprovante Obrigatório
Para garantir a integridade dos dados, comentar ou denunciar exige o anexo de um comprovante (Foto, Galeria, PDF, Print ou NFC-e/NFe).
* **Validação automática e OCR** para extrair CNPJ e data.
* Moderação manual complementar via painel administrativo.

### 🚨 Sistema de Denúncia
Canal direto para relatar problemas sérios, como falhas no motor após abastecer, combustível visivelmente adulterado ou cobrança abusiva de volume (ex: bomba registrando mais m³ de GNV do que a capacidade física do cilindro).
* Exige upload obrigatório de comprovante.
* Histórico transparente de denúncias.
* Postos suspeitos recebem a flag "Sob Análise".

### 🏆 Sistema de Influência
Gamificação onde a comunidade ganha pontos por colaborar ativamente:
* Atualizar preços, enviar comprovantes válidos e fazer avaliações úteis.
* **Níveis:** Iniciante ➔ Colaborador ➔ Influente ➔ Especialista ➔ Embaixador.

### 📊 Histórico e Controle Pessoal
* Registro de tipo de combustível, valor pago e Km do veículo.
* Cálculo de média de consumo.
* Geração de relatórios mensais com opção de exportação para PDF.

---

## 🧱 Arquitetura e Tecnologias

* **Frontend Web:** React / Next.js
* **Frontend Mobile:** React Native
* **Backend:** Node.js (Express ou NestJS)
* **Banco de Dados:** PostgreSQL
* **Armazenamento:** AWS S3 (para comprovantes)
* **Autenticação e Segurança:** JWT, OAuth (Google/Apple), senhas criptografadas (bcrypt), validação de CPF e análise antifraude. Em conformidade com a LGPD.

## 📦 Estrutura do Projeto

```text
fuelrank/
│
├── frontend/
│   ├── web/
│   └── mobile/
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── middlewares/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
└── README.md
## 📈 Roadmap

- [ ] **MVP:** Cadastro/Login, listagem de postos, atualização de preços, upload de comprovantes, avaliação básica.
- [ ] **V1:** Sistema de influência, painel admin completo, histórico pessoal de abastecimento e OCR automatizado.
- [ ] **V2:** Sistema de Cashback, parcerias com postos, ranking por cidade, notificações push inteligentes.

## 💰 Modelo de Negócio (Futuro)

* Destaque patrocinado para postos parceiros.
* Assinatura Premium para gestão avançada de frotas.
* Comissão sobre programas de cashback.
* Publicidade segmentada.

## 👥 Público-Alvo

* **Motoristas de aplicativo:** Que precisam otimizar ao máximo os custos diários com combustível.
* Motoristas de carro e moto em geral.
* Frotistas e pequenos empresários.
* Consumidores engajados que buscam economia e transparência.

---

## 📜 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).

## 👨‍💻 Autor

**Theo Guerra** Estudante de Análise e Desenvolvimento de Sistemas  
📍 Rio de Janeiro - RJ
