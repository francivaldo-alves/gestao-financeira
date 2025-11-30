#!/usr/bin/env bash
# Script de exemplo para testar endpoints da API usando curl

API_URL="http://localhost:5000/api"

echo "1) Registrar usuário (substitua email/senha quando for rodar)"
curl -s -X POST "$API_URL/auth/register" -H "Content-Type: application/json" -d '{"email":"teste@example.com","password":"senha123"}' | jq || true
echo

echo "2) Login para obter token"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"teste@example.com","password":"senha123"}' | jq -r '.token')
echo "TOKEN: $TOKEN"
echo

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Não foi possível obter token. Verifique credenciais ou registre o usuário primeiro."
  exit 1
fi

echo "3) Criar transação (POST)"
curl -s -X POST "$API_URL/transactions" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"type":"expense","amount":50.5,"description":"Almoço","date":"2025-11-27","category":"alimentacao","paymentMethod":"card","note":"Teste via curl","isRecurring":false}' | jq || true
echo

echo "4) Listar transações (GET)"
curl -s -X GET "$API_URL/transactions" -H "Authorization: Bearer $TOKEN" | jq || true
echo

echo "5) Exemplo: listar por mês/ano (nov/2025)"
curl -s -X GET "$API_URL/transactions?month=11&year=2025" -H "Authorization: Bearer $TOKEN" | jq || true
echo

echo "Script finalizado. Substitua valores conforme necessário."
