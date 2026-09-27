from fastapi import responses

somente_admin = responses.Response(
    content="Somente Administradores podem executar esta acao!",
    status_code=403
)

nao_encontrado = responses.Response(
    content="Registro nao encontrado!",
    status_code=404
)
