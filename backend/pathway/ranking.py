import pathway as pw


class Complaint(pw.Schema):
    wardNumber: int
    status: str


complaints = pw.io.csv.read(
    "complaints.csv",
    schema=Complaint
)


def weight(status):
    if status == "pending":
        return 3
    if status == "resolved":
        return 1
    return 0

weighted = complaints.with_columns(
    score=pw.apply(weight, complaints.status),
    completed=pw.apply(lambda s: 1 if s == "completed" else 0, complaints.status)
)


aggregated = weighted.groupby(
    weighted.wardNumber
).reduce(
    total_score=pw.reducers.sum(weighted.score),
    completed_count=pw.reducers.sum(weighted.completed)
)


ranked = aggregated.sort(
    aggregated.total_score,
    -aggregated.completed_count
)


ranked = ranked.with_columns(
    rank=pw.this.total_score.rank()
)


pw.io.csv.write(
    ranked,
    "ward_ranking.csv"
)

pw.run()
