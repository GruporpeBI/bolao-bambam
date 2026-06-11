"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "gold" | "outline" | "ghost" | "green";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#F7EDE0] text-[#7D1A2E] font-bold hover:bg-white active:scale-95",
  green:   "bg-[#7D1A2E] text-[#F7EDE0] font-bold border border-[#F7EDE0]/15 hover:bg-[#6B1526] active:scale-95",
  outline: "border-2 border-[#F7EDE0]/45 text-[#F7EDE0] hover:border-[#F7EDE0] hover:bg-[#F7EDE0]/5 active:scale-95",
  ghost:   "text-[#F7EDE0] hover:bg-[#F7EDE0]/10 active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs tracking-[0.08em]",
  md: "px-6 py-3 text-sm tracking-[0.08em]",
  lg: "px-8 py-4 text-sm tracking-[0.08em]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "gold", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-sm font-bold uppercase transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
