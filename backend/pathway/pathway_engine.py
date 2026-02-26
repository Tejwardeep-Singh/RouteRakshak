import pathway as pw
from fastapi import FastAPI
from pydantic import BaseModel
import threading

app = FastAPI()

complaint_stream = None  


class ComplaintSchema(pw.Schema):
    wardNumber: int
    status: str


def setup_pathway():
    global complaint_stream

    complaint_stream = pw.io.python.read(
        subject=pw.io.python.ConnectorSubject(),
        schema=ComplaintSchema
    )

    score_map = {
        "completed": 10,
        "resolved": 5,
        "pending": -5,
        "in-progress": -2
    }

    scored = complaint_stream.select(
        wardNumber=pw.this.wardNumber,
        score=pw.apply(lambda s: score_map.get(s, 0), pw.this.status)
    )

    aggregated = scored.groupby(
        pw.this.wardNumber
    ).reduce(
        wardNumber=pw.this.wardNumber,
        performanceScore=pw.reducers.sum(pw.this.score)
    )

    ranked = aggregated.sort(
        key=pw.this.performanceScore,
        reverse=True
    )

    pw.io.print(ranked)


@app.on_event("startup")
async def startup_event():
    setup_pathway()
    threading.Thread(target=pw.run, daemon=True).start()


class ComplaintEvent(BaseModel):
    wardNumber: int
    status: str


@app.post("/event")
async def receive_event(event: ComplaintEvent):
    complaint_stream.write({
        "wardNumber": event.wardNumber,
        "status": event.status
    })
    return {"status": "streamed"}