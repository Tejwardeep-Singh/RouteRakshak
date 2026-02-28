import pathway as pw
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
EVENT_FILE = BASE_DIR / "events.jsonl"



class ComplaintSchema(pw.Schema):
    wardNumber: int
    status: str

score_map = {
    "completed": 10,
    "resolved": 5,
    "pending": -5,
    "in-progress": -2
}

table = pw.io.jsonlines.read(
    str(EVENT_FILE),
    schema=ComplaintSchema,
    mode="streaming"
)

scored = table.select(
    wardNumber=pw.this.wardNumber,
    score=(
        pw.if_else(pw.this.status == "completed", 10,
        pw.if_else(pw.this.status == "resolved", 5,
        pw.if_else(pw.this.status == "pending", -5,
        pw.if_else(pw.this.status == "in-progress", -2, 0))))
    )
)

aggregated = scored.groupby(
    pw.this.wardNumber
).reduce(
    wardNumber=pw.this.wardNumber,
    performanceScore=pw.reducers.sum(pw.this.score)
)

RANK_FILE = BASE_DIR / "ranking.json"

pw.io.jsonlines.write(
    aggregated,
    str(RANK_FILE)
)
pw.run()