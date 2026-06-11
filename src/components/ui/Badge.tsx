import { HTMLAttributes } from "react";

type Variant = "gold" | "green" | "dark" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#F7EDE0] text-[#7D1A2E]",
  green:   "bg-[#1E2B8F] text-[#F7EDE0]",
  dark:    "bg-transparent text-[#F7EDE0]/70 border border-[#F7EDE0]/35",
  outline: "border border-[#F7EDE0] text-[#F7EDE0]",
};

export default function Badge({ variant = "gold", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
