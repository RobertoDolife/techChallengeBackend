# 📋 Índice de Problemas e Soluções

## Tech Challenge Backend - Análise de Código

Esta pasta contém documentação detalhada de todos os problemas identificados no código, suas explicações e soluções passo a passo.

---

## 🚨 Problemas Críticos de Segurança

### [01 - Configuração CORS Duplicada](./01-cors-duplicado.md)
**Severidade:** ⚠️ Alta  
**Categoria:** Segurança, Configuração  
**Resumo:** CORS configurado duas vezes com regras conflitantes, permitindo acesso de qualquer origem.

**Impacto:**
- Falha de segurança em produção
- Comportamento imprevisível
- Credenciais não funcionam corretamente

**Solução:** Remover CORS duplicado e configurar origem dinâmica via variável de ambiente.

---

### [02 - Senhas Armazenadas em Texto Plano](./02-senha-texto-plano.md)
**Severidade:** 🔴 CRÍTICA  
**Categoria:** Segurança, Autenticação  
**Resumo:** Senhas são armazenadas e comparadas como texto plano no banco de dados.

**Impacto:**
- VULNERABILIDADE CRÍTICA
- Violação da LGPD
- Risco total em caso de vazamento

**Solução:** Implementar bcrypt para hash de senhas com salt automático.

---

### [03 - JWT_SECRET Não Configurado](./03-jwt-secret-faltando.md)
**Severidade:** 🔴 CRÍTICA  
**Categoria:** Segurança, Configuração  
**Resumo:** JWT_SECRET não está validado, podendo ser undefined em produção.

**Impacto:**
- Tokens inválidos
- Falha silenciosa
- Vulnerabilidade de falsificação

**Solução:** Adicionar validação de JWT_SECRET no Zod com mínimo de 32 caracteres.

---

### [04 - Falta de Validação no Upload de Arquivos](./04-falta-validacao-upload.md)
**Severidade:** 🔴 CRÍTICA  
**Categoria:** Segurança, Upload  
**Resumo:** Upload aceita qualquer tipo de arquivo sem validação de tipo, tamanho ou nome.

**Impacto:**
- Execução remota de código
- Ataque de negação de serviço
- Path traversal

**Solução:** Implementar validação de MIME type, extensão, tamanho e nome seguro com crypto.

---

### [05 - Falta de Autenticação nas Rotas Protegidas](./05-falta-autenticacao-rotas.md)
**Severidade:** 🔴 CRÍTICA  
**Categoria:** Segurança, Autenticação  
**Resumo:** Rotas de criação, edição e exclusão não possuem autenticação.

**Impacto:**
- Qualquer pessoa pode criar/editar/deletar posts
- Sem controle de acesso
- Violação de privacidade

**Solução:** Criar middleware de autenticação JWT e verificação de proprietário.

---

## ⚠️ Problemas de Validação e Qualidade

### [06 - SQL Injection e Validação de Entrada](./06-validacao-entrada.md)
**Severidade:** ⚠️ Alta  
**Categoria:** Segurança, Validação  
**Resumo:** Falta validação adequada de entrada de dados e sanitização contra XSS.

**Impacto:**
- Dados inválidos no banco
- Vulnerabilidade XSS
- Erros genéricos

**Solução:** Implementar schemas Zod e middleware de validação centralizado.

---

### [07 - Variáveis de Ambiente com Nomes Inconsistentes](./07-variaveis-ambiente-inconsistentes.md)
**Severidade:** ⚠️ Média  
**Categoria:** Configuração, DX (Developer Experience)  
**Resumo:** `.env.example` usa nomes diferentes dos validados em `env.js`.

**Impacto:**
- Aplicação não inicia
- Erros confusos
- DATABASE_NAME não validado

**Solução:** Padronizar nomes e criar script de validação.

---

### [08 - Logs e Tratamento de Erros Inadequados](./08-logs-inadequados.md)
**Severidade:** ⚠️ Média  
**Categoria:** Observabilidade, Debug  
**Resumo:** Uso de console.log/error sem contexto e exposição de erros genéricos.

**Impacto:**
- Difícil debug em produção
- Possível exposição de dados sensíveis
- Sem rastreabilidade

**Solução:** Implementar Winston com logs estruturados e error handler centralizado.

---

## 📊 Resumo de Severidade

| Severidade | Quantidade | Problemas |
|------------|------------|-----------|
| 🔴 Crítica | 4 | #02, #03, #04, #05 |
| ⚠️ Alta | 2 | #01, #06 |
| ⚠️ Média | 2 | #07, #08 |

---

## 🛠️ Ordem Recomendada de Correção

1. **Fase 1 - Segurança Crítica** (Não pode ir para produção sem corrigir)
   - [ ] #02 - Senhas em texto plano
   - [ ] #03 - JWT_SECRET faltando
   - [ ] #05 - Falta de autenticação nas rotas
   - [ ] #04 - Validação de upload

2. **Fase 2 - Segurança e Configuração**
   - [ ] #01 - CORS duplicado
   - [ ] #06 - Validação de entrada
   - [ ] #07 - Variáveis de ambiente

3. **Fase 3 - Qualidade e Observabilidade**
   - [ ] #08 - Logs e tratamento de erros

---

## 📦 Dependências Necessárias

Para implementar todas as soluções, instale:

```bash
npm install bcrypt winston xss file-type mime-types express-rate-limit helmet
```

---

## ✅ Checklist de Segurança Pós-Correção

Após implementar todas as correções, verifique:

- [ ] Senhas criptografadas com bcrypt
- [ ] JWT_SECRET configurado e forte (32+ chars)
- [ ] Todas as rotas protegidas requerem autenticação
- [ ] Upload valida tipo, tamanho e nome de arquivo
- [ ] CORS configurado com origens específicas
- [ ] Validação de entrada com Zod em todas as rotas
- [ ] Logs estruturados com Winston
- [ ] Error handler centralizado
- [ ] Variáveis de ambiente validadas na inicialização
- [ ] Rate limiting em rotas sensíveis
- [ ] Helmet aplicado para headers de segurança

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🤝 Contribuindo

Encontrou mais problemas? Adicione documentação seguindo o padrão:

1. Descrição clara do problema
2. Por que é um problema
3. Como resolver (passo a passo)
4. Solução implementada
5. Boas práticas adicionais
6. Referências

---

**Última atualização:** 27/12/2025  
**Versão:** 1.0.0
