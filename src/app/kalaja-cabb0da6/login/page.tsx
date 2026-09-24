import type { Metadata } from "next";
import { login } from "./actions";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Sign in — Alboholic",
  robots: { index: false, follow: false },
};

export default async function StudioLoginPage({
  searchParams,
}: PageProps<"/kalaja-cabb0da6/login">) {
  const { error } = await searchParams;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form action={login}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className={styles.submit} type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
