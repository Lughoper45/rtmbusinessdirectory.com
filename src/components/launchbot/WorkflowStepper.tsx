import { Check } from "lucide-react";
import type { LaunchBotWorkflow } from "@/types/launchBot";

type WorkflowStepperProps = {
  workflow: LaunchBotWorkflow;
};

const WorkflowStepper = ({ workflow }: WorkflowStepperProps) => {
  const { steps, current_step, title } = workflow;

  return (
    <div className="px-3 pt-3 pb-1 border-b border-border/60 bg-background/60 shrink-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 px-1">
        {title}
      </p>
      <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const done = index < current_step;
          const active = index === current_step;
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center min-w-[52px]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-secondary border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span
                  className={`mt-1 text-[9px] text-center leading-tight max-w-[56px] ${
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-px w-3 mb-4 shrink-0 ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
