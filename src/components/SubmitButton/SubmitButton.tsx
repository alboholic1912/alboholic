"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./SubmitButton.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: ReactNode;
};

export default function SubmitButton({
  children,
  pendingText,
  className,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      className={`${styles.button} ${className ?? ""}`}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending && <span className={styles.spinner} aria-hidden="true" />}
      {pending ? pendingText ?? children : children}
    </button>
  );
}
