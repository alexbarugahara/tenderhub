"use client";

interface SolicitationWorkflowProps {
  type: string;
}

interface WorkflowStep {
  label: string;
}

const workflows: Record<string, WorkflowStep[]> = {
  RFP: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Proposals" },
    { label: "Evaluate" },
    { label: "Award" },
    { label: "Contract" },
  ],

  RFQ: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Quotations" },
    { label: "Evaluate" },
    { label: "Award" },
    { label: "Contract" },
  ],

  EOI: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Expressions of Interest" },
    { label: "Review / Shortlist" },
  ],

  RFI: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Information" },
    { label: "Market Analysis" },
  ],

  ITB: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Bids" },
    { label: "Evaluate" },
    { label: "Award" },
    { label: "Contract" },
  ],

  ITT: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Tenders" },
    { label: "Evaluate" },
    { label: "Award" },
    { label: "Contract" },
  ],

  IFB: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Bids" },
    { label: "Evaluate" },
    { label: "Award" },
    { label: "Contract" },
  ],

  OTHER: [
    { label: "Prepare" },
    { label: "Publish" },
    { label: "Receive Responses" },
    { label: "Review" },
    { label: "Complete" },
  ],
};

export default function SolicitationWorkflow({
  type,
}: SolicitationWorkflowProps) {
  const steps = workflows[type] ?? workflows.OTHER;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Procurement Workflow</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The typical workflow for this solicitation type.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center">
          {steps.map((step, index) => (
            <div key={`${step.label}-${index}`} className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div className="whitespace-nowrap">
                  <p className="text-sm font-semibold">{step.label}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="mx-4 h-px w-10 shrink-0 bg-border"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
