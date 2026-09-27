from api.services.database_manager import get_session
from sqlalchemy import select

from api.services.models import HistoricoConsumo

from fastapi import APIRouter, responses, Header

import pandas as pd
import io
import matplotlib
# Backend sem janela: com o padrao (TkAgg) o servidor criava objetos Tk em
# threads de worker e logava "RuntimeError: main thread is not in main loop".
matplotlib.use("Agg")
import matplotlib.pyplot as plt

router = APIRouter()

@router.get("/consumo")
def consumo():

    data_fin = []

    # get_session() faz o failover (Postgres -> Supabase); Session(engine)
    # amarrava o endpoint ao primario e retornava 500 com ele fora do ar.
    with get_session() as session:
        stmt = select(HistoricoConsumo)
        stmt = stmt.order_by(HistoricoConsumo.materia_prima_id.desc())

        result = session.execute(stmt)
        consumos = result.scalars().all()

        for c in consumos:
            data_fin.append((
                c.materia_prima_id,
                c.quantidade
            ))

    df = pd.DataFrame(
        data_fin,
        columns=["Matéria Prima", "Quantidade"]
    )

    fig, ax = plt.subplots()

    fig.patch.set_alpha(0)
    ax.set_facecolor("none")

    df.plot(
        kind="bar",
        x="Matéria Prima",
        y="Quantidade",
        ax=ax,
        color="white"
    )

    ax.tick_params(axis="both", colors="white")

    ax.xaxis.label.set_color("white")
    ax.yaxis.label.set_color("white")
    ax.title.set_color("white")

    for spine in ax.spines.values():
        spine.set_color("white")

    legend = ax.get_legend()
    if legend:
        for text in legend.get_texts():
            text.set_color("white")

    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(
        buf,
        format="png",
        transparent=True,
        bbox_inches="tight"
    )
    buf.seek(0)

    plt.close(fig)

    return responses.StreamingResponse(
        buf,
        media_type="image/png"
    )