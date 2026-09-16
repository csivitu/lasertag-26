const STORAGE_KEY = "lasertag_has_account";

export function readHasAccount(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markHasAccount(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    return;
  }
}
