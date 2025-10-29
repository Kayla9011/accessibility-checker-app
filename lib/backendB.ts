// lib/backendB.ts
// Small typed client for Backend-B (FastAPI): create a job and poll until done.

const B_URL = process.env.BACKEND_B_URL!;
const TIMEOUT = Number(process.env.ANALYZE_TIMEOUT_MS || 30000);
const POLL_MS = Number(process.env.ANALYZE_POLL_MS || 1200);

/** Create an audit job on Backend-B (POST /api/audits -> { job_id }) */
export async function createAudit(url: string) {
  const res = await fetch(`${B_URL}/api/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Backend-B create failed: ${res.status}`);
  const j = await res.json();
  const id: string | undefined = j.id ?? j.job_id; // accept either name
  if (!id) throw new Error("Backend-B did not return an id/job_id");
  return { id };
}

/** Poll Backend-B until the job result is available (GET /api/audits/{id}) */
export async function waitForAuditResult(id: string) {
  const start = Date.now();
  while (true) {
    const res = await fetch(`${B_URL}/api/audits/${id}`);
    if (!res.ok) throw new Error(`Backend-B fetch failed: ${res.status}`);
    const data = await res.json();
    if (data?.status === "done" || data?.score !== undefined) return data;
    if (Date.now() - start > TIMEOUT) throw new Error("Analyze timeout");
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}
