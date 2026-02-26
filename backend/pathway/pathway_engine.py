import pathway as pw
from fastapi import FastAPI
from pydantic import BaseModel
import threading
import uvicorn

app = FastAPI()

class ComplaintSchema(pw.Schema):
    wardNumber: int
    status: str

complaint_stream = pw.io.python.read(schema=ComplaintSchema)

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

def run_pathway():
    pw.run()

threading.Thread(target=run_pathway, daemon=True).start()

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)