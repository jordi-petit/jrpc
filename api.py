
import requests
import json
from typing import Any, TypedDict



def uppercase(arg: str) -> str:
    '''Converts a string to uppercase'''

    response = requests.post('http://localhost:8000/jrpc', json={"name": "uppercase", "arg": arg})
    result = response.json()
    # estaria bé verificar que el tipus retornat compleix amb el promès (l'API ja ho fa però així el client també en tindria la seguretat)
    return result


def division(arg: {'a': float, 'b': float}) -> float:
    '''Divides two numbers'''

    response = requests.post('http://localhost:8000/jrpc', json={"name": "division", "arg": arg})
    result = response.json()
    # estaria bé verificar que el tipus retornat compleix amb el promès (l'API ja ho fa però així el client també en tindria la seguretat)
    return result
