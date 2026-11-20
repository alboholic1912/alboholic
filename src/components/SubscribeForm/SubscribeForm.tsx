"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import { subscribe, type SubscribeState } from "@/app/subscribe/actions";
import styles from "./SubscribeForm.module.css";

const INITIAL: SubscribeState = { status: "idle" };

export default function SubscribeForm() {
  const [state, action] = useActionState(subscribe, INITIAL);

  if (state.status === "done") {
    return (
      <p className={styles.done} role="status">
        You&rsquo;re on the list. We&rsquo;ll write when there is something new to read.
      </p>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <label htmlFor="subscribe-email" className={styles.label}>
        Email address
      </label>
      <div className={styles.row}>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          className={styles.input}
          aria-describedby={state.status === "error" ? "subscribe-error" : undefined}
        />
        <SubmitButton className={styles.submit} pendingText="Subscribing…">
          Subscribe
        </SubmitButton>
      </div>

      {/* Hidden from people; see the action. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="subscribe-website">Website</label>
        <input id="subscribe-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <p id="subscribe-error" className={styles.error} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
