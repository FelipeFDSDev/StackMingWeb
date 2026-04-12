# Guia de Deploy — Stack MING + Web


# VISÃO GERAL

```text
Monorepo (main)
 ├── frontend/
 ├── backend/
 ├── mosquitto/
 ├── iot/
 ├── nodered/
 └── docker-compose.yml

Deploy:
 ├── Tag frontend-* → deploy só frontend
 └── Tag backend-* → deploy só backend

Infra:
 └── AWS EC2 + Docker + GitHub Actions
```


# ETAPA 1 — PREPARAR A EC2

## 1. Criar instância na AWS

Configuração recomendada:

* Tipo: t3.small (ou maior)
* Sistema Operacional: Ubuntu 22.04
* Armazenamento: 16Gb

### Portas liberadas (Security Group)

Devido a restrições de firewall institucional, utilizamos portas alternativas na faixa 8000:

| Serviço  | Porta |
| -------- | ----- |
| SSH      | 22    |
| Frontend | 80    |
| MQTT     | 1883  |
| MySQL    | 3306  |
| Backend  | 8080  |
| Node-RED | 8082  |
| InfluxDB | 8083  |
| Grafana  | 8084  |


## 2. Acessar a instância (via AWS Console)

1. No serviço Amazon EC2
2. Selecione sua instância criada
3. Clique em **“Conectar”**
4. Escolha a opção **EC2 Instance Connect (browser)**
5. Clique em **“Connect”**


### Resultado

Você terá acesso direto ao terminal da instância via navegador, sem necessidade de:

* baixar arquivo `.pem`
* configurar SSH local
* usar comandos no seu computador


### Observação

* O usuário padrão será:

```bash
ubuntu
```

* Esse método depende de:

  * porta 22 liberada no Security Group
  * instância com suporte ao EC2 Instance Connect (Ubuntu já possui)



## 3. Instalar Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg


echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker ubuntu
newgrp docker

sudo systemctl start docker
sudo systemctl enable docker
```

Para não precisar usar sempre o *sudo*, faça logout e conecte novamente na instância.

## 4. Clonar repositório e subir stack

```bash
git clone https://github.com/profAndreSouza/StackMingWeb.git
cd StackMingWeb

docker compose up -d --build
```


## Comandos úteis

```bash
# Ver uso de disco
df -h

# Limpar Docker (cuidado: remove tudo)
docker system prune -a -f --volumes
docker system prune -a -f

# Subir serviços específicos
docker compose up -d frontend
docker compose up -d backend
docker compose up -d nodered
docker compose up -d mqtt influxdb grafana mysql
```


# ETAPA 2 — CONFIGURAR CI/CD (SSH)

## 1. Gerar chave SSH na EC2

```bash
ssh-keygen -t rsa -b 4096 -C "deploy"
```

Sugestão:

* Nome do arquivo: `github`


## 2. Autorizar chave

```bash
cat github.pub >> ~/.ssh/authorized_keys
```


## 3. Ajustar permissões

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```


## 4. Copiar chave privada

```bash
cat github
```

Copie completamente:

```text--BEGIN RSA PRIVATE KEY-----
...--END RSA PRIVATE KEY-----
```


## 5. Configurar Secrets no GitHub

Vá em:
Settings → Secrets → Actions → New repository secret

Crie:

```text
EC2_HOST = IP_DA_EC2
EC2_USER = ubuntu
EC2_SSH_KEY = (conteúdo da chave privada)
```


# ETAPA 3 — VERSIONAMENTO POR TAG

## Estratégia

Utilizamos tags para deploy parcial:

* `frontend-*` → deploy frontend
* `backend-*` → deploy backend


## Criar tag do frontend

```bash
git tag frontend-v1.0.0
git push origin frontend-v1.0.0
```


## Criar tag do backend

```bash
git tag backend-v1.0.0
git push origin backend-v1.0.0
```


# ETAPA 4 — GITHUB ACTIONS

Criar arquivo:

```text
.github/workflows/deploy.yml
```


## deploy.yml

```yaml
name: Deploy EC2

on:
  push:
    tags:
      - 'frontend-*'
      - 'backend-*'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Detectar tipo
        id: detect
        run: |
          if [[ "${GITHUB_REF}" == refs/tags/frontend-* ]]; then
            echo "type=frontend" >> $GITHUB_OUTPUT
          else
            echo "type=backend" >> $GITHUB_OUTPUT
          fi

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |

            echo "=== INICIANDO DEPLOY ==="

            echo "Atualizando repositório..."

            cd ~/StackMingWeb

            git fetch --all
            git reset --hard origin/main
            git clean -fd

            if [ "${{ steps.detect.outputs.type }}" = "backend" ]; then
              echo "=== DEPLOY BACKEND ==="
              docker compose stop backend || true
              docker compose rm -f backend || true
              docker compose up -d --build --force-recreate --no-deps backend

            else
              echo "=== DEPLOY FRONTEND ==="
              docker compose stop frontend || true
              docker compose rm -f frontend || true
              docker compose up -d --build --force-recreate --no-deps frontend
            fi

            echo "=== DEPLOY FINALIZADO ==="
```


# ETAPA 5 — PROCESSO DE DEPLOY

## 1. Alterar código

```bash
git add .
git commit -m "update backend"
git push
```


## 2. Criar release (exemplo backend)

```bash
git tag backend-v1.0.1
git push origin backend-v1.0.1
```


## RESULTADO

Fluxo automático:

1. GitHub Actions é acionado
2. Detecta tipo da tag
3. Conecta via SSH na EC2
4. Atualiza repositório
5. Faz checkout da versão
6. Builda o container necessário
7. Reinicia apenas o serviço alterado


## Considerações Importantes

* Deploy é incremental (não derruba toda a stack)
* Backend e frontend são independentes
* MING permanece sempre ativo
* Estratégia ideal para ambientes com baixa disponibilidade
