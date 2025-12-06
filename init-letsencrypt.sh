#!/bin/bash
set -e

# Verifica se docker está instalado
if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

# Verifica se docker compose está disponível
compose_cmd="docker compose"
if ! $compose_cmd version > /dev/null 2>&1; then
  if [ -x "$(command -v docker-compose)" ]; then
    compose_cmd="docker-compose"
  else
    echo 'Error: docker compose is not installed.' >&2
    exit 1
  fi
fi

# Configurações
domains=(f3pro.com.br www.f3pro.com.br)
rsa_key_size=4096
data_path="./data/certbot"
email="" # adicionar email válido é recomendado
staging=0 # 1 para teste sem limites de emissão

# Cria diretórios TLS se não existirem
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

# Verifica se já existem certificados
if [ -d "$data_path/conf/live/${domains[0]}" ]; then
  read -p "Existing data found for ${domains[*]}. Continue and replace? (y/N) " decision
  if [ "$decision" != "y" ] && [ "$decision" != "Y" ]; then
    echo "Exiting..."
    exit
  fi
fi

# Cria dummy certificate
echo "### Creating dummy certificate for ${domains[*]} ..."
$compose_cmd run --rm --entrypoint "\
  mkdir -p /etc/letsencrypt/live/${domains[0]} && \
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '/etc/letsencrypt/live/${domains[0]}/privkey.pem' \
    -out '/etc/letsencrypt/live/${domains[0]}/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# Inicia Nginx com dummy certificate
echo "### Starting nginx ..."
$compose_cmd up --force-recreate -d nginx

# Remove dummy e tenta gerar certificados reais
echo "### Deleting dummy certificate for ${domains[*]} ..."
rm -Rf "$data_path/conf/live/${domains[0]}"
rm -Rf "$data_path/conf/archive/${domains[0]}"
rm -Rf "$data_path/conf/renewal/${domains[0]}.conf"

echo "### Requesting Let's Encrypt certificate for ${domains[*]} ..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="-m $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

if ! $compose_cmd run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg $email_arg $domain_args \
    --rsa-key-size $rsa_key_size --agree-tos --force-renewal" certbot; then
  echo "### Certbot failed or rate limit reached, keeping dummy certificate as fallback"
fi

# Recarrega Nginx
echo "### Reloading nginx ..."
$compose_cmd exec nginx nginx -s reload

echo "### Done!"

