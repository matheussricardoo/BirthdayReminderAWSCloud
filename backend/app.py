"""
Birthday Reminder Backend API
API Flask para cálculo e gerenciamento de lembretes de aniversário

Este módulo implementa:
- API RESTful com endpoints para consulta de aniversários
- Cálculos automáticos de idade e dias até próximo aniversário
- Endpoints específicos para aniversários de hoje e próximos
- Sistema de health check para monitoramento
- CORS habilitado para comunicação com frontend

Arquitetura:
- Banco de dados em memória (lista Python) para simplicidade
- Cálculos de data usando datetime nativo do Python
- API isolada em subnet privada (produção AWS)
- Comunicação apenas com frontend via rede interna

Endpoints:
- GET /health - Verificação de saúde da API
- GET /api/birthdays - Lista todos os aniversários com cálculos
- GET /api/birthdays/today - Aniversários de hoje
- GET /api/birthdays/upcoming - Próximos aniversários (30 dias)

@author matheussricardoo
@version 1.0.0
@project Birthday Reminder AWS Cloud
"""

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, date
import json

# Inicialização da aplicação Flask
app = Flask(__name__)

# Habilita CORS para permitir requisições do frontend
# Necessário para comunicação entre containers Docker
CORS(app)

# Base de dados simples de aniversários em memória
# Em produção, seria substituído por banco de dados real
birthdays_db = [
    {"id": 1, "name": "Matheus Ricardo", "date": "2004-04-07"},
    {"id": 2, "name": "Ana Silva", "date": "1995-12-15"},
    {"id": 3, "name": "Carlos Santos", "date": "2000-06-22"},
    {"id": 4, "name": "Maria Oliveira", "date": "1998-09-30"},
]

def calculate_next_birthday(birth_date_str):
    """Calcula quantos dias faltam para o próximo aniversário"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    today = date.today()
    
    # Aniversário deste ano
    this_year_birthday = birth_date.replace(year=today.year)
    
    # Se já passou este ano, considerar o próximo ano
    if this_year_birthday < today:
        next_birthday = birth_date.replace(year=today.year + 1)
    else:
        next_birthday = this_year_birthday
    
    days_until = (next_birthday - today).days
    age = today.year - birth_date.year
    
    if this_year_birthday < today:
        age += 1
    
    return {
        "days_until": days_until,
        "next_birthday": next_birthday.strftime("%d/%m/%Y"),
        "age_next": age if this_year_birthday >= today else age,
        "is_today": days_until == 0
    }

@app.route('/health')
def health_check():
    """Endpoint de verificação de saúde"""
    return jsonify({
        "status": "healthy",
        "service": "Birthday Reminder API",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/birthdays')
def get_all_birthdays():
    """Retorna todos os aniversários com informações calculadas"""
    enriched_birthdays = []
    
    for person in birthdays_db:
        birthday_info = calculate_next_birthday(person["date"])
        
        enriched_person = {
            "id": person["id"],
            "name": person["name"],
            "birth_date": person["date"],
            "birth_date_formatted": datetime.strptime(person["date"], "%Y-%m-%d").strftime("%d/%m/%Y"),
            "days_until_birthday": birthday_info["days_until"],
            "next_birthday": birthday_info["next_birthday"],
            "age_next": birthday_info["age_next"],
            "is_birthday_today": birthday_info["is_today"]
        }
        
        enriched_birthdays.append(enriched_person)
    
    # Ordenar por proximidade do aniversário
    enriched_birthdays.sort(key=lambda x: x["days_until_birthday"])
    
    return jsonify({
        "birthdays": enriched_birthdays,
        "total": len(enriched_birthdays),
        "today": date.today().strftime("%d/%m/%Y")
    })

@app.route('/api/birthdays/today')
def get_todays_birthdays():
    """Retorna aniversários de hoje"""
    today_birthdays = []
    
    for person in birthdays_db:
        birthday_info = calculate_next_birthday(person["date"])
        if birthday_info["is_today"]:
            today_birthdays.append({
                "id": person["id"],
                "name": person["name"],
                "age": birthday_info["age_next"]
            })
    
    return jsonify({
        "birthdays_today": today_birthdays,
        "count": len(today_birthdays),
        "date": date.today().strftime("%d/%m/%Y")
    })

@app.route('/api/birthdays/upcoming')
def get_upcoming_birthdays():
    """Retorna próximos aniversários (próximos 30 dias)"""
    upcoming = []
    
    for person in birthdays_db:
        birthday_info = calculate_next_birthday(person["date"])
        if 0 <= birthday_info["days_until"] <= 30:
            upcoming.append({
                "id": person["id"],
                "name": person["name"],
                "days_until": birthday_info["days_until"],
                "next_birthday": birthday_info["next_birthday"],
                "age_next": birthday_info["age_next"]
            })
    
    upcoming.sort(key=lambda x: x["days_until"])
    
    return jsonify({
        "upcoming_birthdays": upcoming,
        "count": len(upcoming)
    })

if __name__ == '__main__':
    print("Iniciando API de Lembretes de Aniversario")
    print("Rodando na porta 25000")
    app.run(host='0.0.0.0', port=25000, debug=True)