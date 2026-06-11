import { HTMLAttributes } from "react";

type Variant = "dark" | "cream" | "gold";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  dark:  "bg-[#5A1220] border border-[#F7EDE0]/20 text-[#F7EDE0]",
  cream: "bg-[#F7EDE0] border border-[#5A1220]/10 text-[#5A1220]",
  gold:  "bg-[#F7EDE0] border border-[#EDE0CE] text-[#5A1220]",
};

export default function Card({ variant = "dark", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-sm p-6 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
