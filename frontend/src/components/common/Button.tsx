import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  const classes = [
    variant === "ghost" ? "ghost" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
};

export default Button;
