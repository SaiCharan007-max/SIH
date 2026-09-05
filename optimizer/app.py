from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PlanningSnapshot, OptimizedPlanOutput
from solver import solve_planning_snapshot
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("railway-block-optimizer")

app = FastAPI(
    title="Railway Maintenance Block Optimizer",
    description="Google OR-Tools CP-SAT based maintenance block scheduling & consolidation microservice.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "railway-block-optimizer"
    }

@app.post("/optimize", response_model=OptimizedPlanOutput)
def optimize_block_plan(snapshot: PlanningSnapshot):
    try:
        logger.info(f"Received optimization request for date: {snapshot.plan_date} with {len(snapshot.jobs)} jobs")
        result = solve_planning_snapshot(snapshot)
        logger.info(f"Optimization finished: {result.metrics.jobs_scheduled}/{result.metrics.jobs_considered} scheduled in {len(result.blocks)} blocks. Status: {result.solver_status}")
        return result
    except Exception as e:
        logger.exception("Error occurred during block optimization")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
