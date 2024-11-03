
import requests
import json
from typing import Any, TypedDict

def _execute(name: str, arg: Any) -> Any:
    response = requests.post('http://localhost:8000/jrpc', json={"name": name, "arg": arg})
    result = response.json()
    if result['error']:
        raise Exception(result['error'])
    # estaria bé verificar aquí que el tipus retornat compleix amb el promès (l'API ja ho fa però així el client també en tindria la seguretat)
    return result['result']


def uppercase(arg: str) -> str:
    
    """
    No summary

    
    """


    return _execute('uppercase', arg)


def division(arg: {'a': float, 'b': float}) -> float:
    
    """
    Divide two numbers

    This function divides two numbers and may throw an error if the second number is zero.
    """


    return _execute('division', arg)
