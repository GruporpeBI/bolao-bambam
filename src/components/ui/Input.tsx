"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#F7EDE0] uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`bg-[#5A1220] border ${error ? "border-red-500" : "border-[#F7EDE0]/30"} text-[#F7EDE0] rounded-sm px-4 py-3 text-base outline-none focus:border-[#F7EDE0] transition-colors placeholder:text-[#F7EDE0]/30 ${className}`}
          {...props}
        />
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
