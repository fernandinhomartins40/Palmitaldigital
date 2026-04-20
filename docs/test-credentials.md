# Credenciais de teste

Estas contas sao criadas por `apps/api/prisma/seed.ts`.

## Senhas

- Usuarios de teste: `SEED_TEST_PASSWORD`
- Valor padrao do seed: `Teste123456`
- Admin seed: `SEED_ADMIN_PASSWORD`
- Valor padrao local do admin: `admin123456`

## Producao

- O admin em producao usa o valor de `SEED_ADMIN_PASSWORD` definido na VPS.
- Essa senha nao deve ser versionada neste repositorio.
- Os usuarios `@palmital.test` so existirao em ambientes onde o seed tiver sido executado com sucesso.

## Admin

| Perfil | Email | Senha |
| --- | --- | --- |
| Admin | `admin@palmital.digital` | `SEED_ADMIN_PASSWORD` |

## Usuarios

| Perfil | Email | Senha |
| --- | --- | --- |
| Ana Souza | `ana.souza@palmital.test` | `SEED_TEST_PASSWORD` |
| Bruno Lima | `bruno.lima@palmital.test` | `SEED_TEST_PASSWORD` |
| Carla Fernandes | `carla.fernandes@palmital.test` | `SEED_TEST_PASSWORD` |
| Diego Alves | `diego.alves@palmital.test` | `SEED_TEST_PASSWORD` |
| Elisa Moraes | `elisa.moraes@palmital.test` | `SEED_TEST_PASSWORD` |
| Fabio Gomes | `fabio.gomes@palmital.test` | `SEED_TEST_PASSWORD` |
| Gabriela Rocha | `gabriela.rocha@palmital.test` | `SEED_TEST_PASSWORD` |
| Henrique Nunes | `henrique.nunes@palmital.test` | `SEED_TEST_PASSWORD` |

## Donos de empresa

| Perfil | Empresa | Email | Senha |
| --- | --- | --- | --- |
| Mariana Silva | `Casa do Campo Palmital` | `mariana.silva@palmital.test` | `SEED_TEST_PASSWORD` |
| Ricardo Melo | `Auto Prime Palmital` | `ricardo.melo@palmital.test` | `SEED_TEST_PASSWORD` |
| Juliana Ribeiro | `Atelier Flor de Cafe` | `juliana.ribeiro@palmital.test` | `SEED_TEST_PASSWORD` |
| Paulo Teixeira | `Tech Vale Assistencia` | `paulo.teixeira@palmital.test` | `SEED_TEST_PASSWORD` |
| Renata Barbosa | `Imobiliaria Centro Oeste` | `renata.barbosa@palmital.test` | `SEED_TEST_PASSWORD` |
