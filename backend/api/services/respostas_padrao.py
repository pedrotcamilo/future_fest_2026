from fastapi import responses

campos_pendentes = responses.Response(
    content="Campos pendentes!",
    status_code=400
)